const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  jobId: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Ensure compound index for unique bookmarks
SavedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', SavedJobSchema);
