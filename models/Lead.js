// Request Callback/Contact form data
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: function() {
        // Phone is required for callback and symptom forms, optional for contact
        return this.formType && this.formType !== 'contact';
      },
      default: '',
    },
    message: {
      type: String,
    },
    symptoms: {
      type: String,
    },
    formType: {
      type: String,
      enum: ['callback', 'symptom', 'contact'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lead', leadSchema);

