const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getPatientProfile,
  getDoctorProfile,
  updateMedicalHistory,
  getMedicalHistory,
} = require('../controllers/profileController');
const { protect, doctor, admin, patient } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.get('/patient/:id', protect, getPatientProfile); // Doctor or Admin
router.get('/doctor/:id', getDoctorProfile); // Public
router.put('/medical-history', protect, patient, updateMedicalHistory);
router.get('/medical-history', protect, getMedicalHistory);

module.exports = router;

