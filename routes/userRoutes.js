const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUserStatus,
  updateUser,
  deleteUser,
  getUserStats,
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/stats', protect, admin, getUserStats);
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, getUser);
router.put('/:id/status', protect, admin, updateUserStatus);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;

