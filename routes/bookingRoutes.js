const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  getMyAppointments,
  getDoctorAppointments,
  cancelAppointment,
  rescheduleAppointment,
  addConsultationNotes,
  markAppointmentCompleted,
} = require('../controllers/bookingController');
const { protect, admin, patient, doctor, patientOrDoctor } = require('../middlewares/authMiddleware');

router.post('/', protect, createAppointment); // Patients only (checked in controller)
router.get('/', protect, admin, getAppointments);
router.get('/my-appointments', protect, patient, getMyAppointments);
router.get('/doctor-appointments', protect, doctor, getDoctorAppointments);
router.get('/:id', protect, getAppointment); // Access control handled in controller
router.put('/:id', protect, admin, updateAppointment);
router.put('/:id/complete', protect, markAppointmentCompleted); // Access control handled in controller
router.put('/:id/cancel', protect, patientOrDoctor, cancelAppointment);
router.put('/:id/reschedule', protect, patientOrDoctor, rescheduleAppointment);
router.put('/:id/consultation-notes', protect, doctor, addConsultationNotes);

module.exports = router;

