const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescription,
  updatePrescription,
} = require('../controllers/prescriptionController');
const { protect, doctor, patientOrDoctor } = require('../middlewares/authMiddleware');

router.post('/', protect, doctor, createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, patientOrDoctor, getPrescription);
router.put('/:id', protect, doctor, updatePrescription);

module.exports = router;

