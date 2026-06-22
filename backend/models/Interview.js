const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    required: true
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
  seekerName: {
    type: String,
    required: true
  },
  employerId: {
    type: String,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', InterviewSchema);
