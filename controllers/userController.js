// User management
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { createActivityLog } = require('./activityLogController');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional info based on role
    let additionalInfo = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      additionalInfo.doctorProfile = doctor;
    } else if (user.role === 'patient') {
      const appointmentCount = await Appointment.countDocuments({ patientId: user._id });
      additionalInfo.appointmentCount = appointmentCount;
    }

    res.json({
      ...user.toObject(),
      ...additionalInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldStatus = user.status;
    user.status = status;
    await user.save();

    // Log activity
    try {
      await createActivityLog(
        req.user._id,
        `Updated user status from ${oldStatus} to ${status}`,
        'user',
        user._id,
        { oldStatus, newStatus: status },
        req.ip
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, dateOfBirth, gender, role, status } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow changing role to admin unless current user is admin
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign admin role' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // Log activity
    try {
      await createActivityLog(
        req.user._id,
        'Updated user information',
        'user',
        user._id,
        { updatedFields: Object.keys(req.body) },
        req.ip
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete related data
    if (user.role === 'doctor') {
      await Doctor.deleteMany({ userId: user._id });
    }

    await User.findByIdAndDelete(req.params.id);

    // Log activity
    try {
      await createActivityLog(
        req.user._id,
        'Deleted user',
        'user',
        user._id,
        { deletedUser: user.email },
        req.ip
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, totalAdmins, pendingUsers, approvedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'pending' }),
      User.countDocuments({ status: 'approved' }),
    ]);

    res.json({
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAdmins,
      pendingUsers,
      approvedUsers,
      rejectedUsers: totalUsers - pendingUsers - approvedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUserStatus,
  updateUser,
  deleteUser,
  getUserStats,
};

