// Favorite doctors management
const Favorite = require('../models/Favorite');
const Doctor = require('../models/Doctor');

// @desc    Add doctor to favorites
// @route   POST /api/favorites
// @access  Private/Patient
const addFavorite = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({ userId: req.user._id, doctorId });
    if (existing) {
      return res.status(400).json({ message: 'Doctor is already in favorites' });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      doctorId,
    });

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove doctor from favorites
// @route   DELETE /api/favorites/:doctorId
// @access  Private/Patient
const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      doctorId: req.params.doctorId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    await favorite.deleteOne();

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private/Patient
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('doctorId')
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if doctor is favorited
// @route   GET /api/favorites/check/:doctorId
// @access  Private/Patient
const checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      doctorId: req.params.doctorId,
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
};

