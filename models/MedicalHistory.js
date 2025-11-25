// Patient medical records
const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    medications: {
      type: [String],
      default: [],
    },
    pastSurgeries: {
      type: [String],
      default: [],
    },
    chronicConditions: {
      type: [String],
      default: [],
    },
    familyHistory: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);

