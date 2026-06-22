const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['seeker', 'employer', 'admin']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'suspended']
  },
  resumePath: {
    type: String,
    default: null
  },
  resumeName: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  profilePicture: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  preferredRole: {
    type: String,
    default: ''
  },
  preferredLocation: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  industry: {
    type: String,
    default: ''
  },
  companyDescription: {
    type: String,
    default: ''
  },
  companyWebsite: {
    type: String,
    default: ''
  },
  companyLocation: {
    type: String,
    default: ''
  },
  verificationRequested: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
