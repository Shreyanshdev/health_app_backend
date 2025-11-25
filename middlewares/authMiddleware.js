// Protect Admin routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify access token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is approved (not pending or rejected)
      if (req.user.status !== 'approved') {
        return res.status(403).json({ 
          message: 'Account not approved. Please wait for admin approval.' 
        });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid access token',
          code: 'INVALID_TOKEN'
        });
      }
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// @desc    Admin only
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// @desc    Patient only
const patient = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Patients only.' });
  }
};

// @desc    Doctor only
const doctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Doctors only.' });
  }
};

// @desc    Patient or Doctor
const patientOrDoctor = (req, res, next) => {
  if (req.user && (req.user.role === 'patient' || req.user.role === 'doctor')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Patients or doctors only.' });
  }
};

module.exports = { protect, admin, patient, doctor, patientOrDoctor };

