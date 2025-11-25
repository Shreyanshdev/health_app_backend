const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  refreshToken, 
  logout,
  createAdmin,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
} = require('../controllers/authController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.post('/create-admin', protect, admin, createAdmin);
router.get('/pending-doctors', protect, admin, getPendingDoctors);
router.post('/approve-doctor/:id', protect, admin, approveDoctor);
router.post('/reject-doctor/:id', protect, admin, rejectDoctor);

module.exports = router;

