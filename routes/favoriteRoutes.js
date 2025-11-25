const express = require('express');
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
} = require('../controllers/favoriteController');
const { protect, patient } = require('../middlewares/authMiddleware');

router.post('/', protect, patient, addFavorite);
router.delete('/:doctorId', protect, patient, removeFavorite);
router.get('/', protect, patient, getFavorites);
router.get('/check/:doctorId', protect, patient, checkFavorite);

module.exports = router;

