// Nodemailer setup (Confirmations)
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// @desc    Send appointment confirmation email
const sendAppointmentConfirmation = async (appointment) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: appointment.patientEmail,
      subject: 'Appointment Confirmation',
      html: `
        <h2>Appointment Confirmed</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment has been confirmed.</p>
        <p><strong>Date:</strong> ${appointment.appointmentDate}</p>
        <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
        <p><strong>Type:</strong> ${appointment.appointmentType}</p>
        <p>Thank you for choosing our services.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation email sent');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// @desc    Send doctor notification email
const sendDoctorNotification = async (appointment, doctorEmail) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: doctorEmail,
      subject: 'New Appointment Booking',
      html: `
        <h2>New Appointment</h2>
        <p>You have a new appointment booking.</p>
        <p><strong>Patient:</strong> ${appointment.patientName}</p>
        <p><strong>Date:</strong> ${appointment.appointmentDate}</p>
        <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
        <p><strong>Type:</strong> ${appointment.appointmentType}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Doctor notification email sent');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// @desc    Send doctor approval email
const sendDoctorApprovalEmail = async (user, request) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Doctor Registration Approved - Health App',
      html: `
        <h2>Congratulations! Your Doctor Registration Has Been Approved</h2>
        <p>Dear ${user.name},</p>
        <p>We are pleased to inform you that your doctor registration request has been approved.</p>
        <p><strong>Specialization:</strong> ${request.specialization}</p>
        <p><strong>Qualification:</strong> ${request.qualification}</p>
        <p>You can now login to your account and start managing your profile and appointments.</p>
        <p>Login at: ${process.env.CLIENT_URL || 'http://localhost:3000'}/login</p>
        <p>Thank you for joining our healthcare platform!</p>
        <p>Best regards,<br>Health App Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Doctor approval email sent');
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

// @desc    Send doctor rejection email
const sendDoctorRejectionEmail = async (user, request) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Doctor Registration Status - Health App',
      html: `
        <h2>Doctor Registration Update</h2>
        <p>Dear ${user.name},</p>
        <p>We regret to inform you that your doctor registration request has been reviewed and unfortunately, we are unable to approve it at this time.</p>
        ${request.rejectionReason ? `<p><strong>Reason:</strong> ${request.rejectionReason}</p>` : ''}
        <p>If you have any questions or would like to discuss this further, please contact our support team.</p>
        <p>Thank you for your interest in joining our healthcare platform.</p>
        <p>Best regards,<br>Health App Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Doctor rejection email sent');
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
};

// @desc    Send appointment reminder
const sendAppointmentReminder = async (appointment, hoursBefore = 24) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: appointment.patientEmail,
      subject: `Appointment Reminder - ${hoursBefore} Hour${hoursBefore > 1 ? 's' : ''} Before`,
      html: `
        <h2>Appointment Reminder</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>This is a reminder that you have an appointment scheduled:</p>
        <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
        <p><strong>Type:</strong> ${appointment.appointmentType}</p>
        <p>Please make sure to be available at the scheduled time.</p>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment reminder email sent');
  } catch (error) {
    console.error('Error sending reminder email:', error);
    throw error;
  }
};

// @desc    Send appointment cancellation email
const sendAppointmentCancellation = async (appointment, cancelledBy) => {
  try {
    const isPatient = cancelledBy.toString() === appointment.patientId.toString();
    const recipientEmail = isPatient ? appointment.patientEmail : (appointment.doctorId?.userId?.email || '');
    const recipientName = isPatient ? appointment.patientName : (appointment.doctorId?.userId?.name || 'Doctor');

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject: 'Appointment Cancelled',
      html: `
        <h2>Appointment Cancelled</h2>
        <p>Dear ${recipientName},</p>
        <p>Your appointment has been cancelled.</p>
        <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
        ${appointment.cancellationReason ? `<p><strong>Reason:</strong> ${appointment.cancellationReason}</p>` : ''}
        <p>If you need to reschedule, please book a new appointment.</p>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment cancellation email sent');
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
};

// @desc    Send appointment rescheduled email
const sendAppointmentRescheduled = async (appointment) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: appointment.patientEmail,
      subject: 'Appointment Rescheduled',
      html: `
        <h2>Appointment Rescheduled</h2>
        <p>Dear ${appointment.patientName},</p>
        <p>Your appointment has been rescheduled:</p>
        <p><strong>New Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
        <p><strong>New Time:</strong> ${appointment.appointmentTime}</p>
        <p><strong>Type:</strong> ${appointment.appointmentType}</p>
        <p>Please update your calendar accordingly.</p>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment rescheduled email sent');
  } catch (error) {
    console.error('Error sending rescheduled email:', error);
    throw error;
  }
};

// @desc    Send prescription email
const sendPrescriptionEmail = async (prescription, patientEmail, patientName) => {
  try {
    const medicationsList = prescription.medications.map(med => 
      `<li>${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}</li>`
    ).join('');

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: patientEmail,
      subject: 'Your Prescription - Health App',
      html: `
        <h2>Prescription</h2>
        <p>Dear ${patientName},</p>
        <p>Please find your prescription below:</p>
        <h3>Medications:</h3>
        <ul>${medicationsList}</ul>
        ${prescription.instructions ? `<p><strong>Instructions:</strong> ${prescription.instructions}</p>` : ''}
        ${prescription.followUpDate ? `<p><strong>Follow-up Date:</strong> ${new Date(prescription.followUpDate).toLocaleDateString()}</p>` : ''}
        <p>Please follow the prescription as directed by your doctor.</p>
        <p>Thank you!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Prescription email sent');
  } catch (error) {
    console.error('Error sending prescription email:', error);
    throw error;
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendDoctorNotification,
  sendDoctorApprovalEmail,
  sendDoctorRejectionEmail,
  sendAppointmentReminder,
  sendAppointmentCancellation,
  sendAppointmentRescheduled,
  sendPrescriptionEmail,
};

