const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  seekerId: {
    type: String,
    required: true
  },
  employerId: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  additionalTerms: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Sent',
    enum: ['Sent', 'Viewed', 'Accepted', 'Declined']
  },
  pdfPath: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
