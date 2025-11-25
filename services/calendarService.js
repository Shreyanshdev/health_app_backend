// Google/Apple Calendar Sync Logic
const { google } = require('googleapis');

// Helper function to parse and validate date
const parseAppointmentDateTime = (appointmentDate, appointmentTime) => {
  try {
    // Handle different date formats
    let date;
    if (appointmentDate instanceof Date) {
      date = appointmentDate;
    } else if (typeof appointmentDate === 'string') {
      // Try parsing as ISO string first
      date = new Date(appointmentDate);
      // If invalid, try parsing as date string with time
      if (isNaN(date.getTime())) {
        // Format: YYYY-MM-DD
        const dateStr = appointmentDate.split('T')[0];
        const timeStr = appointmentTime || '00:00';
        date = new Date(`${dateStr}T${timeStr}`);
      }
    } else {
      throw new Error('Invalid date format');
    }

    // Validate the date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    throw new Error('Invalid appointment date or time');
  }
};

// @desc    Sync appointment to Google Calendar
const syncToGoogleCalendar = async (appointment) => {
  try {
    // Skip if Google Calendar credentials are not configured
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Google Calendar credentials not configured, skipping sync');
      return null;
    }

    // Parse and validate date
    const startDate = parseAppointmentDateTime(appointment.appointmentDate, appointment.appointmentTime);
    const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 minutes duration

    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Create event
    const event = {
      summary: `Appointment with ${appointment.patientName}`,
      description: `Appointment Type: ${appointment.appointmentType}\nSymptoms: ${appointment.symptoms || 'N/A'}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: appointment.patientEmail },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });

    return response.data.id;
  } catch (error) {
    console.error('Error syncing to Google Calendar:', error);
    throw error;
  }
};

// @desc    Sync appointment to Apple Calendar (iCal format)
const syncToAppleCalendar = async (appointment) => {
  try {
    // Validate date before generating iCal
    const startDate = parseAppointmentDateTime(appointment.appointmentDate, appointment.appointmentTime);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid appointment date for Apple Calendar');
    }

    // Apple Calendar uses iCal format
    // For Apple Calendar, we typically generate an .ics file
    // This is a simplified version - you may need to implement full iCal generation
    
    const icsContent = generateICalFile(appointment);
    
    // In a real implementation, you might:
    // 1. Save the .ics file and provide download link
    // 2. Send via email attachment
    // 3. Use Apple Calendar API if available
    
    // For now, return a reference ID
    return `apple_cal_${appointment._id}_${Date.now()}`;
  } catch (error) {
    console.error('Error syncing to Apple Calendar:', error);
    // Return null instead of throwing to prevent breaking appointment creation
    return null;
  }
};

// @desc    Generate iCal file content
const generateICalFile = (appointment) => {
  const startDate = parseAppointmentDateTime(appointment.appointmentDate, appointment.appointmentTime);
  const endDate = new Date(startDate.getTime() + 30 * 60000);

  const formatDate = (date) => {
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date for iCal format');
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Health App//Appointment Booking//EN
BEGIN:VEVENT
UID:${appointment._id}@healthapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Appointment with ${appointment.patientName}
DESCRIPTION:Appointment Type: ${appointment.appointmentType}
LOCATION:${appointment.appointmentType === 'online' ? 'Online' : 'In-Clinic'}
END:VEVENT
END:VCALENDAR`;
};

module.exports = {
  syncToGoogleCalendar,
  syncToAppleCalendar,
  generateICalFile,
};

