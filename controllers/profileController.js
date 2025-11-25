// Profile management
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const MedicalHistory = require('../models/MedicalHistory');
const { deleteImage } = require('../config/cloudinary');

// @desc    Get user's own profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    
    // If doctor, include doctor profile
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: user._id });
      return res.json({
        ...user.toObject(),
        doctorProfile: doctor,
      });
    }

    // If patient, include medical history
    if (user.role === 'patient') {
      const medicalHistory = await MedicalHistory.findOne({ patientId: user._id });
      return res.json({
        ...user.toObject(),
        medicalHistory: medicalHistory || null,
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth, gender } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture) {
      await deleteImage(user.profilePicture);
    }

    // Save new profile picture URL from Cloudinary
    // req.file.path contains the Cloudinary URL
    const imageUrl = req.file.path;
    user.profilePicture = imageUrl;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient profile (doctor/admin can view)
// @route   GET /api/profile/patient/:id
// @access  Private/Doctor or Admin
const getPatientProfile = async (req, res) => {
  try {
    // Only doctors and admins can view patient profiles
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user || user.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const medicalHistory = await MedicalHistory.findOne({ patientId: user._id });

    res.json({
      ...user.toObject(),
      medicalHistory: medicalHistory || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor public profile
// @route   GET /api/profile/doctor/:id
// @access  Public
const getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email profilePicture');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update medical history
// @route   PUT /api/profile/medical-history
// @access  Private/Patient
const updateMedicalHistory = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update medical history' });
    }

    const { allergies, medications, pastSurgeries, chronicConditions, familyHistory, bloodGroup } = req.body;

    const medicalHistory = await MedicalHistory.findOneAndUpdate(
      { patientId: req.user._id },
      {
        allergies: allergies || [],
        medications: medications || [],
        pastSurgeries: pastSurgeries || [],
        chronicConditions: chronicConditions || [],
        familyHistory: familyHistory || '',
        bloodGroup: bloodGroup || '',
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(medicalHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get medical history
// @route   GET /api/profile/medical-history
// @access  Private/Patient or Doctor
const getMedicalHistory = async (req, res) => {
  try {
    let patientId = req.user._id;

    // If doctor, check if they're viewing a patient's history
    if (req.user.role === 'doctor' && req.query.patientId) {
      patientId = req.query.patientId;
    }

    // If patient, they can only view their own
    if (req.user.role === 'patient' && req.query.patientId && req.query.patientId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view your own medical history' });
    }

    const medicalHistory = await MedicalHistory.findOne({ patientId });

    if (!medicalHistory) {
      return res.json(null);
    }

    res.json(medicalHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getPatientProfile,
  getDoctorProfile,
  updateMedicalHistory,
  getMedicalHistory,
};

