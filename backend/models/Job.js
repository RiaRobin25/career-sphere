const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true,
    default: []
  },
  experience: {
    type: String,
    default: ''
  },
  location: {
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
  duration: {
    type: String,
    default: 'full-time'
  },
  workplaceType: {
    type: String,
    default: 'online'
  },
  experienceLevel: {
    type: String,
    default: 'mid'
  },
  education: {
    type: String,
    default: "Bachelor's"
  },
  jobType: {
    type: String,
    default: 'full-time'
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
