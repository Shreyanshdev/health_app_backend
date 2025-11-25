// Appointment logic + Calendar Sync triggers
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { syncToGoogleCalendar, syncToAppleCalendar } = require('../services/calendarService');
const { sendAppointmentConfirmation, sendAppointmentCancellation, sendAppointmentRescheduled, sendDoctorNotification } = require('../services/emailService');

// Helper function to map notes to consultationNotes for frontend consistency
const mapAppointmentForResponse = (appointment) => {
  if (!appointment) return null;
  const appointmentObj = appointment.toObject ? appointment.toObject() : appointment;
  appointmentObj.consultationNotes = appointmentObj.notes || null;
  return appointmentObj;
};

// Helper function to map array of appointments
const mapAppointmentsForResponse = (appointments) => {
  if (!Array.isArray(appointments)) return appointments;
  return appointments.map(mapAppointmentForResponse);
};

// @desc    Create appointment
// @route   POST /api/bookings
// @access  Private (requires authentication, patients only)
const createAppointment = async (req, res) => {
  try {
    // Get patientId from authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Authentication required. Please login to book an appointment.' });
    }

    // Only patients can book appointments
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments.' });
    }

    // Clean up request body
    const appointmentData = {
      ...req.body,
      patientId: req.user._id, // Use authenticated user's ID
    };
    
    // Remove empty optional fields
    if (!appointmentData.symptoms || appointmentData.symptoms.trim() === '') {
      delete appointmentData.symptoms;
    }

    const appointment = await Appointment.create(appointmentData);

    // Sync to calendars (only if date is valid)
    if (appointment.appointmentDate) {
      try {
        // Validate date before syncing
        const appointmentDate = new Date(appointment.appointmentDate);
        if (!isNaN(appointmentDate.getTime()) && appointment.appointmentTime) {
          const googleEventId = await syncToGoogleCalendar(appointment);
          if (googleEventId) {
            appointment.googleCalendarEventId = googleEventId;
            await appointment.save();
          }
        }
      } catch (error) {
        console.error('Google Calendar sync error:', error);
        // Don't fail the appointment creation if calendar sync fails
      }

      try {
        // Validate date before syncing
        const appointmentDate = new Date(appointment.appointmentDate);
        if (!isNaN(appointmentDate.getTime()) && appointment.appointmentTime) {
          const appleEventId = await syncToAppleCalendar(appointment);
          if (appleEventId) {
            appointment.appleCalendarEventId = appleEventId;
            await appointment.save();
          }
        }
      } catch (error) {
        console.error('Apple Calendar sync error:', error);
        // Don't fail the appointment creation if calendar sync fails
      }
    }

    // Send confirmation email to patient
    try {
      await sendAppointmentConfirmation(appointment);
    } catch (error) {
      console.error('Email sending error:', error);
    }

    // Send notification to doctor
    try {
      const doctor = await Doctor.findById(appointment.doctorId).populate('userId');
      if (doctor && doctor.userId && doctor.userId.email) {
        await sendDoctorNotification(appointment, doctor.userId.email);
      }
    } catch (error) {
      console.error('Doctor notification error:', error);
    }

    res.status(201).json(mapAppointmentForResponse(appointment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments
// @route   GET /api/bookings
// @access  Private/Admin
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId')
      .sort({ appointmentDate: -1 });
    res.json(mapAppointmentsForResponse(appointments));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/bookings/:id
// @access  Private/Admin, Doctor (own appointments), Patient (own appointments)
const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'doctorId',
        strictPopulate: false,
        populate: {
          path: 'userId',
          select: 'name email',
          model: 'User',
          strictPopulate: false
        }
      })
      .populate('patientId', 'name email')
      .lean(); // Returns plain object, faster
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check access permissions
    if (req.user.role === 'admin') {
      // Admin can access any appointment
      return res.json(mapAppointmentForResponse(appointment));
    } else if (req.user.role === 'doctor') {
      // Doctor can only access their own appointments
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found' });
      }
      const appointmentDoctorId = typeof appointment.doctorId === 'object' && appointment.doctorId._id 
        ? appointment.doctorId._id.toString() 
        : appointment.doctorId.toString();
      if (doctor._id.toString() !== appointmentDoctorId) {
        return res.status(403).json({ message: 'Access denied. You can only view your own appointments.' });
      }
      return res.json(mapAppointmentForResponse(appointment));
    } else if (req.user.role === 'patient') {
      // Patient can only access their own appointments
      const appointmentPatientId = typeof appointment.patientId === 'object' && appointment.patientId._id 
        ? appointment.patientId._id.toString() 
        : appointment.patientId.toString();
      if (appointmentPatientId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only view your own appointments.' });
      }
      return res.json(mapAppointmentForResponse(appointment));
    }

    return res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment
// @route   PUT /api/bookings/:id
// @access  Private/Admin
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(mapAppointmentForResponse(appointment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark appointment as completed (Doctor or Admin)
// @route   PUT /api/bookings/:id/complete
// @access  Private/Doctor or Admin
const markAppointmentCompleted = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is admin or the doctor for this appointment
    if (req.user.role === 'admin') {
      // Admin can mark any appointment as completed
      appointment.status = 'completed';
      await appointment.save();
      return res.json(mapAppointmentForResponse(appointment));
    } else if (req.user.role === 'doctor') {
      // Doctor can only mark their own appointments as completed
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found' });
      }
      
      const appointmentDoctorId = appointment.doctorId.toString();
      if (doctor._id.toString() !== appointmentDoctorId) {
        return res.status(403).json({ message: 'You can only mark your own appointments as completed' });
      }
      
      appointment.status = 'completed';
      await appointment.save();
      return res.json(mapAppointmentForResponse(appointment));
    } else {
      return res.status(403).json({ message: 'Access denied. Only doctors and admins can mark appointments as completed.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient's own appointments
// @route   GET /api/bookings/my-appointments
// @access  Private/Patient
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        strictPopulate: false,
        populate: {
          path: 'userId',
          select: 'name email',
          model: 'User',
          strictPopulate: false
        }
      })
      .populate('prescriptionId')
      .sort({ appointmentDate: -1 })
      .lean();
    
    res.json(mapAppointmentsForResponse(appointments));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get doctor's appointments
// @route   GET /api/bookings/doctor-appointments
// @access  Private/Doctor
const getDoctorAppointments = async (req, res) => {
  try {
    // Find doctor profile for this user
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'name email phone')
      .populate('prescriptionId')
      .sort({ appointmentDate: -1 });
    res.json(mapAppointmentsForResponse(appointments));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel appointment
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Patient or Doctor
const cancelAppointment = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is the patient or the doctor
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isDoctor = doctor && doctor._id.toString() === appointment.doctorId.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'You can only cancel your own appointments' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
    }

    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = cancellationReason || 'No reason provided';
    appointment.cancelledBy = req.user._id;
    await appointment.save();

    // Send cancellation email
    try {
      await sendAppointmentCancellation(appointment, req.user._id);
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }

    res.json(mapAppointmentForResponse(appointment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/bookings/:id/reschedule
// @access  Private/Patient or Doctor
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is the patient or the doctor
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isDoctor = doctor && doctor._id.toString() === appointment.doctorId.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'You can only reschedule your own appointments' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a cancelled appointment' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot reschedule a completed appointment' });
    }

    if (appointmentDate) {
      appointment.appointmentDate = new Date(appointmentDate);
    }
    if (appointmentTime) {
      appointment.appointmentTime = appointmentTime;
    }
    appointment.status = 'pending'; // Reset to pending when rescheduled

    await appointment.save();

    // Send rescheduled email
    try {
      await sendAppointmentRescheduled(appointment);
    } catch (error) {
      console.error('Error sending rescheduled email:', error);
    }

    res.json(mapAppointmentForResponse(appointment));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add consultation notes
// @route   PUT /api/bookings/:id/consultation-notes
// @access  Private/Doctor
const addConsultationNotes = async (req, res) => {
  try {
    const { consultationNotes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is the doctor for this appointment
    const Doctor = require('../models/Doctor');
    const doctor = await Doctor.findOne({ userId: req.user._id });
    
    if (!doctor || doctor._id.toString() !== appointment.doctorId.toString()) {
      return res.status(403).json({ message: 'You can only add notes to your own appointments' });
    }

    // Map consultationNotes to notes field in model
    appointment.notes = consultationNotes;
    await appointment.save();

    // Return appointment with consultationNotes field for frontend consistency
    const appointmentObj = appointment.toObject();
    appointmentObj.consultationNotes = appointment.notes;
    res.json(appointmentObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

