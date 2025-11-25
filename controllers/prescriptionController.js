// Prescription management
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { sendPrescriptionEmail } = require('../services/emailService');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medications, instructions, followUpDate } = req.body;

    if (!appointmentId || !medications || medications.length === 0) {
      return res.status(400).json({ message: 'Appointment ID and medications are required' });
    }

    // Verify appointment exists and belongs to this doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'Doctor profile not found' });
    }
    
    const appointmentDoctorId = appointment.doctorId.toString();
    if (doctor._id.toString() !== appointmentDoctorId) {
      return res.status(403).json({ message: 'You can only create prescriptions for your own appointments' });
    }

    // Allow prescriptions for confirmed or completed appointments
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot create prescription for cancelled appointments' });
    }

    // Populate doctor with user info for notification
    await doctor.populate('userId', 'name');
    const doctorName = doctor?.userId?.name || 'Your doctor';

    // Create prescription
    const prescription = await Prescription.create({
      appointmentId,
      doctorId: req.user._id,
      patientId: appointment.patientId,
      medications,
      instructions: instructions || '',
      followUpDate: followUpDate || null,
    });

    // Link prescription to appointment
    appointment.prescriptionId = prescription._id;
    await appointment.save();

    // Create notification for patient
    
    await Notification.create({
      userId: appointment.patientId,
      type: 'prescription',
      title: 'New Prescription from Doctor',
      message: `Dr. ${doctorName} has sent you a new prescription for your appointment on ${new Date(appointment.appointmentDate).toLocaleDateString()}. Please check your prescriptions section.`,
      link: `/patient/prescriptions`,
      isRead: false,
    });

    // Send email to patient
    try {
      await sendPrescriptionEmail(prescription, appointment.patientEmail, appointment.patientName);
    } catch (error) {
      console.error('Error sending prescription email:', error);
    }

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescriptions (patient's own or doctor's created)
// @route   GET /api/prescriptions
// @access  Private
const getPrescriptions = async (req, res) => {
  try {
    let prescriptions;

    if (req.user.role === 'patient') {
      // Patient sees their own prescriptions
      prescriptions = await Prescription.find({ patientId: req.user._id })
        .populate('doctorId', 'specialization')
        .populate('appointmentId', 'appointmentDate appointmentTime')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'doctor') {
      // Doctor sees prescriptions they created
      prescriptions = await Prescription.find({ doctorId: req.user._id })
        .populate('patientId', 'name email')
        .populate('appointmentId', 'appointmentDate appointmentTime')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private/Patient or Doctor
const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctorId',
        select: 'specialization',
        strictPopulate: false,
        populate: {
          path: 'userId',
          select: 'name email',
          model: 'User',
          strictPopulate: false
        }
      })
      .populate('patientId', 'name email')
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate appointmentTime',
        strictPopulate: false,
        populate: {
          path: 'doctorId',
          strictPopulate: false,
          populate: {
            path: 'userId',
            select: 'name email',
            model: 'User',
            strictPopulate: false
          }
        }
      })
      .lean(); // Returns plain object, faster and allows modification

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check access
    if (req.user.role === 'patient') {
      const patientId = typeof prescription.patientId === 'object' 
        ? prescription.patientId._id?.toString() || prescription.patientId._id
        : prescription.patientId?.toString();
      if (patientId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'doctor') {
      const doctorId = typeof prescription.doctorId === 'object' 
        ? prescription.doctorId._id?.toString() || prescription.doctorId._id
        : prescription.doctorId?.toString();
      if (doctorId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private/Doctor
const updatePrescription = async (req, res) => {
  try {
    const { medications, instructions, followUpDate } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check if doctor owns this prescription
    if (prescription.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own prescriptions' });
    }

    if (medications) prescription.medications = medications;
    if (instructions !== undefined) prescription.instructions = instructions;
    if (followUpDate !== undefined) prescription.followUpDate = followUpDate;

    await prescription.save();

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
  getPrescription,
  updatePrescription,
};

