// Review management
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private/Patient
const createReview = async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, comment } = req.body;

    if (!doctorId || !appointmentId || !rating) {
      return res.status(400).json({ message: 'Doctor ID, appointment ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify appointment belongs to patient and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own appointments' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed appointments' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already exists for this appointment' });
    }

    // Create review
    const review = await Review.create({
      doctorId,
      patientId: req.user._id,
      appointmentId,
      rating,
      comment: comment || '',
      status: 'approved', // Auto-approve for now, can be changed to 'pending' for moderation
    });

    // Update doctor rating
    await updateDoctorRating(doctorId);

    // Create notification for doctor
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (doctor && doctor.userId) {
      await Notification.create({
        userId: doctor.userId._id,
        type: 'review',
        title: 'New Review Received',
        message: `You received a ${rating}-star review from ${req.user.name}`,
        link: `/doctors/${doctorId}`,
      });
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a doctor
// @route   GET /api/reviews/doctor/:doctorId
// @access  Public
const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ 
      doctorId, 
      status: 'approved' 
    })
      .populate('patientId', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Patient (own review)
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Update doctor rating
    await updateDoctorRating(review.doctorId);

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Patient (own review)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const doctorId = review.doctorId;
    await review.deleteOne();

    // Update doctor rating
    await updateDoctorRating(doctorId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Moderate review (approve/reject)
// @route   PUT /api/reviews/:id/moderate
// @access  Private/Admin
const moderateReview = async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
    }

    review.status = status;
    await review.save();

    // Update doctor rating if approved
    if (status === 'approved') {
      await updateDoctorRating(review.doctorId);
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update doctor rating
const updateDoctorRating = async (doctorId) => {
  try {
    const reviews = await Review.find({ 
      doctorId, 
      status: 'approved' 
    });

    if (reviews.length === 0) {
      await Doctor.findByIdAndUpdate(doctorId, {
        rating: 0,
        totalReviews: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Error updating doctor rating:', error);
  }
};

module.exports = {
  createReview,
  getDoctorReviews,
  updateReview,
  deleteReview,
  moderateReview,
};

