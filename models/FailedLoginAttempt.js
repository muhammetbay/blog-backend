// models/FailedLoginAttempt.js
const mongoose = require('mongoose')

const FailedLoginAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ip: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('FailedLoginAttempt', FailedLoginAttemptSchema)
