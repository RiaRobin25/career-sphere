const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
});

const ApplicationSchema = new mongoose.Schema({
  applicantId: {
    type: String,
    required: true
  },
  employerId: {
    type: String,
    required: true
  },
  jobId: {
    type: String,
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    default: null
  },
  resumeName: {
    type: String,
    default: null
  },
  atsStatus: {
    type: String,
    default: 'Applied',
    enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Rejected', 'Selected', 'Interview']
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  statusHistory: {
    type: [StatusHistorySchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
