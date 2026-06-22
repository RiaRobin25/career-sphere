const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  seekerId: {
    type: String,
    required: true
  },
  seekerName: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'approved',
    enum: ['pending', 'approved', 'rejected']
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
