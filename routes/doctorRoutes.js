const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', getDoctors);
router.get('/:id', getDoctor);
router.post('/', protect, admin, createDoctor);
router.put('/:id', protect, admin, updateDoctor);
router.delete('/:id', protect, admin, deleteDoctor);

module.exports = router;

