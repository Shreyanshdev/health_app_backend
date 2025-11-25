// Login/Register (for Admin)
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorRegistrationRequest = require('../models/DoctorRegistrationRequest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendDoctorApprovalEmail, sendDoctorRejectionEmail } = require('../services/emailService');

// Helper function to generate access token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// @desc    Register user (patient or doctor request)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only allow patient or doctor registration (no admin)
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is not allowed through this endpoint' });
    }

    // Default to patient if no role specified
    const userRole = role || 'patient';

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set status based on role
    const status = userRole === 'doctor' ? 'pending' : 'approved';

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      status: status,
    });

    // If doctor, create registration request
    if (userRole === 'doctor') {
      const { specialization, qualification, experience, bio } = req.body;
      
      if (!specialization || !qualification) {
        // Delete user if required fields missing
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ 
          message: 'Specialization and qualification are required for doctor registration' 
        });
      }

      await DoctorRegistrationRequest.create({
        userId: user._id,
        specialization,
        qualification,
        experience: experience || 0,
        bio: bio || '',
        status: 'pending',
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      message: userRole === 'doctor' 
        ? 'Registration request submitted. You will receive an email once approved.'
        : 'Registration successful',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Calculate refresh token expiry (default: 7 days)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(
      refreshTokenExpiry.getDate() +
        parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '7')
    );

    // Save refresh token to database
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();

    // Set refresh token as HTTP-only cookie (more secure)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshTokenExpiry.getTime() - Date.now(),
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not provided' });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database
      await User.findOneAndUpdate(
        { refreshToken },
        {
          $set: {
            refreshToken: null,
            refreshTokenExpiry: null,
          },
        }
      );
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create admin (admin only)
// @route   POST /api/auth/create-admin
// @access  Private/Admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Admin created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending doctor requests
// @route   GET /api/auth/pending-doctors
// @access  Private/Admin
const getPendingDoctors = async (req, res) => {
  try {
    const requests = await DoctorRegistrationRequest.find({ status: 'pending' })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve doctor registration
// @route   POST /api/auth/approve-doctor/:id
// @access  Private/Admin
const approveDoctor = async (req, res) => {
  try {
    const request = await DoctorRegistrationRequest.findById(req.params.id)
      .populate('userId');

    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update user status
    const user = await User.findById(request.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    await user.save();

    // Create doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization: request.specialization,
      qualification: request.qualification,
      experience: request.experience,
      bio: request.bio,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    });

    // Update request status
    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    // Send approval email
    try {
      await sendDoctorApprovalEmail(user, request);
    } catch (error) {
      console.error('Error sending approval email:', error);
    }

    res.json({
      message: 'Doctor approved successfully',
      doctor: {
        _id: doctor._id,
        userId: user._id,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject doctor registration
// @route   POST /api/auth/reject-doctor/:id
// @access  Private/Admin
const rejectDoctor = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await DoctorRegistrationRequest.findById(req.params.id)
      .populate('userId');

    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update user status
    const user = await User.findById(request.userId);
    if (user) {
      user.status = 'rejected';
      await user.save();
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.rejectionReason = rejectionReason || 'Application rejected by admin';
    await request.save();

    // Send rejection email
    try {
      await sendDoctorRejectionEmail(user, request);
    } catch (error) {
      console.error('Error sending rejection email:', error);
    }

    res.json({
      message: 'Doctor registration rejected',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  createAdmin,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
};

