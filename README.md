# Health App - Backend Server

A robust Express.js backend API for a comprehensive healthcare platform. This RESTful API provides endpoints for managing appointments, prescriptions, user authentication, payments, and more.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Architecture](#architecture)
- [Services](#services)
- [Available Scripts](#available-scripts)
- [Development Guidelines](#development-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This backend server powers a full-stack healthcare platform that enables:

- **User Management**: Registration, authentication, role-based access control (Admin, Doctor, Patient)
- **Appointment System**: Booking, scheduling, cancellation, and rescheduling
- **Payment Integration**: Razorpay payment gateway integration
- **Prescription Management**: Digital prescription creation and management
- **Blog System**: SEO-friendly blog/article management
- **Review System**: Doctor ratings and reviews
- **Notification System**: Real-time notifications for users
- **Calendar Integration**: Google Calendar and Apple Calendar sync
- **Email Notifications**: Automated email reminders and confirmations

The API follows RESTful principles and uses JWT-based authentication with access and refresh tokens.

## 🛠 Tech Stack

### Core Technologies
- **Node.js** - JavaScript runtime
- **Express.js 4.21.2** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 8.20.1** - MongoDB object modeling

### Key Dependencies
- **jsonwebtoken 9.0.2** - JWT authentication
- **bcryptjs 2.4.3** - Password hashing
- **cors 2.8.5** - Cross-Origin Resource Sharing
- **multer 2.0.2** - File upload handling
- **cloudinary 1.41.0** - Cloud-based image and file management
- **multer-storage-cloudinary 4.0.0** - Cloudinary storage engine for Multer
- **razorpay 2.9.6** - Payment gateway integration
- **nodemailer 6.9.9** - Email service
- **googleapis 144.0.0** - Google Calendar integration
- **node-cron 4.2.1** - Scheduled tasks
- **dotenv 16.6.1** - Environment variable management

### Development Tools
- **nodemon 3.1.0** - Development server with auto-reload

## ✨ Features

### Authentication & Authorization
- 🔐 JWT-based authentication (access + refresh tokens)
- 👥 Role-based access control (Admin, Doctor, Patient)
- 🔄 Token refresh mechanism
- 🛡️ Protected routes with middleware
- ✅ Account approval system for doctors

### Appointment Management
- 📅 Create, view, update appointments
- ⏰ Appointment scheduling with time slots
- ❌ Cancel and reschedule appointments
- 📝 Consultation notes
- ✅ Mark appointments as completed
- 📧 Email confirmations and reminders

### Payment Integration
- 💳 Razorpay payment gateway
- 🔒 Secure payment verification
- 📊 Transaction logging
- 💰 Payment status tracking

### Prescription Management
- 💊 Digital prescription creation
- 📋 Medication management
- 📝 Diagnosis and instructions
- 🔄 Prescription updates

### Content Management
- 📖 Blog/article system
- 🔍 SEO-friendly URLs (slugs)
- 🏷️ Category and tag management
- 📸 Featured image support

### Additional Features
- ⭐ Doctor reviews and ratings
- 🔔 Notification system
- ❤️ Favorite doctors
- 📊 Activity logging
- 📧 Email notifications
- 📅 Calendar integration (Google & Apple)
- 📁 File upload (profile pictures, documents) - Cloudinary integration

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local instance or MongoDB Atlas account)
- **Git**

### External Services Required

- **MongoDB Atlas** (or local MongoDB) - Database
- **Razorpay Account** - Payment processing
- **SMTP Service** - Email notifications (Gmail, Outlook, etc.)
- **Google Cloud** (optional) - Google Calendar integration

## 🚀 Installation

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file (see Environment Variables section)
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate JWT secret:**
   ```bash
   openssl rand -base64 32
   # Copy the output to JWT_SECRET in .env
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Verify the server is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","message":"Server is running"}`

## 🔐 Environment Variables

For detailed environment variable setup, see [ENV_SETUP.md](./ENV_SETUP.md) or [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md).

### Quick Reference

**Required Variables:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
JWT_SECRET=your_secure_jwt_secret_min_32_characters
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Optional Variables:**
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 📁 Project Structure

```
server/
├── config/                 # Configuration files
│   ├── db.js              # MongoDB connection
│   ├── razorpay.js       # Razorpay configuration
│   └── cloudinary.js     # Cloudinary configuration
├── controllers/          # Route controllers (business logic)
│   ├── authController.js
│   ├── bookingController.js
│   ├── doctorController.js
│   ├── paymentController.js
│   ├── prescriptionController.js
│   └── ...
├── middlewares/          # Express middlewares
│   ├── authMiddleware.js # Authentication & authorization
│   ├── errorMiddleware.js # Error handling
│   └── uploadMiddleware.js # File upload handling
├── models/               # Mongoose models (database schemas)
│   ├── User.js
│   ├── Doctor.js
│   ├── Appointment.js
│   ├── Prescription.js
│   └── ...
├── routes/               # API route definitions
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── doctorRoutes.js
│   └── ...
├── services/            # Business logic services
│   ├── emailService.js  # Email sending service
│   ├── calendarService.js # Calendar integration
│   └── appointmentReminderService.js # Scheduled reminders
├── uploads/             # Uploaded files (profiles, documents)
│   └── profiles/
├── server.js            # Application entry point
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user (invalidates refresh token)
- `POST /api/auth/create-admin` - Create admin user (Admin only)
- `GET /api/auth/pending-doctors` - Get pending doctor registrations (Admin only)
- `POST /api/auth/approve-doctor/:id` - Approve doctor registration (Admin only)
- `POST /api/auth/reject-doctor/:id` - Reject doctor registration (Admin only)

### Doctors (`/api/doctors`)
- `GET /api/doctors` - Get all doctors (public)
- `GET /api/doctors/:id` - Get single doctor (public)
- `POST /api/doctors` - Create doctor profile (Admin only)
- `PUT /api/doctors/:id` - Update doctor profile (Admin/Doctor only)
- `DELETE /api/doctors/:id` - Delete doctor (Admin only)

### Appointments (`/api/bookings`)
- `POST /api/bookings` - Create appointment (Patient only)
- `GET /api/bookings` - Get all appointments (Admin only)
- `GET /api/bookings/my-appointments` - Get user's appointments (Patient only)
- `GET /api/bookings/doctor-appointments` - Get doctor's appointments (Doctor only)
- `GET /api/bookings/:id` - Get single appointment (Authorized users)
- `PUT /api/bookings/:id` - Update appointment (Admin only)
- `PUT /api/bookings/:id/cancel` - Cancel appointment (Patient/Doctor)
- `PUT /api/bookings/:id/reschedule` - Reschedule appointment (Patient/Doctor)
- `PUT /api/bookings/:id/complete` - Mark appointment as completed (Authorized)
- `PUT /api/bookings/:id/consultation-notes` - Add consultation notes (Doctor only)

### Payments (`/api/payments`)
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

### Prescriptions (`/api/prescriptions`)
- `POST /api/prescriptions` - Create prescription (Doctor only)
- `GET /api/prescriptions` - Get prescriptions (Authorized)
- `GET /api/prescriptions/:id` - Get single prescription (Patient/Doctor)
- `PUT /api/prescriptions/:id` - Update prescription (Doctor only)

### Blogs (`/api/blogs`)
- `GET /api/blogs` - Get all blogs (public, filtered by published status)
- `GET /api/blogs/public` - Get published blogs only (public)
- `GET /api/blogs/:slug` - Get blog by slug (public)
- `POST /api/blogs` - Create blog (Admin only)
- `PUT /api/blogs/:id` - Update blog (Admin only)
- `DELETE /api/blogs/:id` - Delete blog (Admin only)

### Reviews (`/api/reviews`)
- `POST /api/reviews` - Create review (Patient only)
- `GET /api/reviews` - Get reviews (public)
- `GET /api/reviews/doctor/:doctorId` - Get doctor reviews (public)
- `PUT /api/reviews/:id` - Update review (Authorized)
- `DELETE /api/reviews/:id` - Delete review (Authorized)

### Users (`/api/users`)
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/stats` - Get user statistics (Admin only)
- `GET /api/users/:id` - Get single user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Profile (`/api/profile`)
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update current user profile
- `POST /api/profile/upload` - Upload profile picture

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Favorites (`/api/favorites`)
- `POST /api/favorites` - Add doctor to favorites (Patient only)
- `GET /api/favorites` - Get user's favorite doctors (Patient only)
- `DELETE /api/favorites/:doctorId` - Remove favorite (Patient only)

### Leads (`/api/leads`)
- `POST /api/leads` - Create lead (callback/symptom/contact forms)
- `GET /api/leads` - Get all leads (Admin only)
- `PUT /api/leads/:id/status` - Update lead status (Admin only)

### Activity Logs (`/api/activity-logs`)
- `GET /api/activity-logs` - Get activity logs (Admin only)
- `GET /api/activity-logs/user/:userId` - Get user activity logs (Admin only)

### Health Check
- `GET /api/health` - Server health check (public)

## 🔒 Authentication

### JWT Token System

The API uses a dual-token authentication system:

1. **Access Token** (Short-lived, 15 minutes)
   - Sent in `Authorization: Bearer <token>` header
   - Used for API authentication
   - Expires quickly for security

2. **Refresh Token** (Long-lived, 7 days)
   - Stored in HTTP-only cookie (more secure)
   - Can also be sent in request body
   - Used to obtain new access tokens
   - Stored in database with expiry date

### Authentication Flow

```
1. POST /api/auth/login
   → Returns: { accessToken, user }
   → Sets refreshToken in HTTP-only cookie

2. API Requests
   → Include: Authorization: Bearer <accessToken>

3. Access Token Expires
   → POST /api/auth/refresh
   → Returns: { accessToken }

4. Logout
   → POST /api/auth/logout
   → Invalidates refresh token
```

### Protected Routes

Routes are protected using middleware:

- `protect` - Requires valid access token
- `admin` - Requires admin role
- `patient` - Requires patient role
- `doctor` - Requires doctor role
- `patientOrDoctor` - Requires patient or doctor role

### Example Request

```javascript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken } = await response.json();

// Authenticated Request
const data = await fetch('http://localhost:5000/api/bookings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

## 🏗 Architecture

### MVC Pattern

The application follows the Model-View-Controller (MVC) pattern:

- **Models** (`models/`) - Database schemas and data models
- **Controllers** (`controllers/`) - Business logic and request handling
- **Routes** (`routes/`) - API endpoint definitions
- **Views** - Not applicable (RESTful API, no views)

### Middleware Stack

1. **CORS** - Cross-Origin Resource Sharing
2. **Body Parser** - Parse JSON and URL-encoded bodies
3. **Cookie Parser** - Parse cookies
4. **Static Files** - Serve uploaded files
5. **Routes** - API endpoints
6. **Error Handler** - Global error handling

### Database Models

- **User** - User accounts (admin, doctor, patient)
- **Doctor** - Doctor profiles and information
- **Appointment** - Appointment bookings
- **Prescription** - Medical prescriptions
- **Blog** - Blog articles
- **Review** - Doctor reviews
- **Transaction** - Payment transactions
- **Notification** - User notifications
- **Lead** - Contact/callback form submissions
- **Favorite** - Patient favorite doctors
- **ActivityLog** - System activity logs
- **MedicalHistory** - Patient medical history

## 🔧 Services

### Email Service (`services/emailService.js`)
- Sends transactional emails
- Appointment confirmations
- Reminders and notifications
- Uses Nodemailer with SMTP

### Calendar Service (`services/calendarService.js`)
- Google Calendar integration
- Apple Calendar integration
- Creates calendar events for appointments
- Generates calendar links

### Appointment Reminder Service (`services/appointmentReminderService.js`)
- Scheduled email reminders
- Uses node-cron for scheduling
- Sends reminders before appointments

## 📜 Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with nodemon (auto-reload on file changes).

### Production
```bash
npm start
```
Starts the production server using Node.js.

## 💻 Development Guidelines

### Code Style
- Use ES6+ JavaScript features
- Follow Express.js best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Add input validation

### File Naming
- Controllers: `*Controller.js`
- Models: PascalCase (e.g., `User.js`)
- Routes: `*Routes.js`
- Middlewares: `*Middleware.js`

### Error Handling
- Use try-catch blocks for async operations
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Use error middleware for global error handling

### Best Practices
- Validate input data
- Sanitize user inputs
- Use environment variables for configuration
- Implement rate limiting (recommended)
- Add request logging
- Use HTTPS in production
- Keep dependencies updated

## 🚀 Deployment

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md).

### Quick Deployment Steps

1. **Prepare environment variables** (see [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md))

2. **Deploy to Render** (or your preferred platform):
   - Connect your repository
   - Set root directory to `server`
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add all environment variables

3. **Configure CORS**:
   - Set `CLIENT_URL` to your frontend URL(s)
   - Multiple URLs: `https://app.vercel.app,https://app-git-main.vercel.app`

4. **Verify deployment**:
   ```bash
   curl https://your-api.onrender.com/api/health
   ```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB URI
- [ ] Use production Razorpay keys
- [ ] Configure SMTP for emails
- [ ] Set `CLIENT_URL` with production frontend URL
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Set up error tracking

## 🐛 Troubleshooting

### Common Issues

**Issue: "MONGO_URI is not defined"**
- ✅ Check `.env` file exists and contains `MONGO_URI`
- ✅ Verify MongoDB connection string format
- ✅ Restart server after adding environment variables

**Issue: "JWT_SECRET must have a value"**
- ✅ Generate JWT secret: `openssl rand -base64 32`
- ✅ Add to `.env` file
- ✅ Restart server

**Issue: CORS errors**
- ✅ Verify `CLIENT_URL` matches frontend URL exactly
- ✅ Include protocol (`https://`) in `CLIENT_URL`
- ✅ No trailing slashes in URLs
- ✅ Redeploy after changing `CLIENT_URL`

**Issue: Database connection failed**
- ✅ Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for cloud)
- ✅ Verify connection string credentials
- ✅ Check network connectivity

**Issue: File uploads not working**
- ✅ Verify Cloudinary credentials are set in environment variables
- ✅ Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`
- ✅ Verify file size is within limits (5MB)
- ✅ Check file format is supported (jpeg, jpg, png, gif, webp)
- ✅ Check Cloudinary dashboard for upload errors

**Issue: Email not sending**
- ✅ Verify SMTP credentials
- ✅ Check SMTP port (587 for TLS, 465 for SSL)
- ✅ For Gmail, use App Password (not regular password)
- ✅ Check firewall/network restrictions

**Issue: Payment verification failing**
- ✅ Verify Razorpay keys match (test/test or live/live)
- ✅ Check webhook configuration (if using)
- ✅ Verify payment amount and currency

### Debugging Tips

1. **Check server logs** for error messages
2. **Use Postman** or similar tool to test API endpoints
3. **Enable detailed logging** in development
4. **Check MongoDB Atlas logs** for database issues
5. **Verify environment variables** are loaded correctly
6. **Test endpoints individually** to isolate issues

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Nodemailer Documentation](https://nodemailer.com/about/)

## 📄 License

ISC

---

**Note:** This is the backend API server. Make sure the frontend client is properly configured to connect to this server. For frontend setup, see [../client/README.md](../client/README.md).

