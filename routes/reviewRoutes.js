const express = require('express');
const router = express.Router();
const {
  createReview,
  getDoctorReviews,
  updateReview,
  deleteReview,
  moderateReview,
} = require('../controllers/reviewController');
const { protect, patient, admin } = require('../middlewares/authMiddleware');

router.post('/', protect, patient, createReview);
router.get('/doctor/:doctorId', getDoctorReviews);
router.put('/:id', protect, patient, updateReview);
router.delete('/:id', protect, patient, deleteReview);
router.put('/:id/moderate', protect, admin, moderateReview);

module.exports = router;

