// Appointment reminder service using cron
const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('./emailService');

// Run every hour to check for appointments
cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Find appointments 24 hours from now (within the next hour)
    const appointments24h = await Appointment.find({
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: {
        $gte: oneDayLater,
        $lt: new Date(oneDayLater.getTime() + 60 * 60 * 1000),
      },
    }).populate('doctorId');

    // Find appointments 1 hour from now (within the next hour)
    const appointments1h = await Appointment.find({
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: {
        $gte: oneHourLater,
        $lt: new Date(oneHourLater.getTime() + 60 * 60 * 1000),
      },
    }).populate('doctorId');

    // Send 24-hour reminders
    for (const appointment of appointments24h) {
      try {
        await sendAppointmentReminder(appointment, 24);
      } catch (error) {
        console.error(`Error sending 24h reminder for appointment ${appointment._id}:`, error);
      }
    }

    // Send 1-hour reminders
    for (const appointment of appointments1h) {
      try {
        await sendAppointmentReminder(appointment, 1);
      } catch (error) {
        console.error(`Error sending 1h reminder for appointment ${appointment._id}:`, error);
      }
    }

    console.log(`Reminder service: Sent ${appointments24h.length} 24h reminders and ${appointments1h.length} 1h reminders`);
  } catch (error) {
    console.error('Error in appointment reminder service:', error);
  }
});

console.log('Appointment reminder service started');

