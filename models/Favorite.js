// Patient favorite doctors
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one user can only favorite a doctor once
favoriteSchema.index({ userId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

