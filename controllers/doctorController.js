// CRUD for doctors
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Get all doctors (with search and filters)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
  try {
    const { search, specialization, minRating, maxFee, minFee, isActive } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by active status (default to active only)
    if (isActive !== 'false') {
      query.isActive = true;
    }

    // Filter by specialization
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    // Filter by rating
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Filter by consultation fee
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = parseFloat(minFee);
      if (maxFee) query.consultationFee.$lte = parseFloat(maxFee);
    }

    let doctors = await Doctor.find(query)
      .populate('userId', 'name email profilePicture')
      .sort({ rating: -1, totalReviews: -1 });

    // Search by name or specialization
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(doctor => {
        const userName = doctor.userId?.name || '';
        return searchRegex.test(userName) || searchRegex.test(doctor.specialization);
      });
    }

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      'userId',
      'name email'
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Doctor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};

