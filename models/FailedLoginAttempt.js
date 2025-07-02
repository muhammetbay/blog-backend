// models/FailedLoginAttempt.js

const mongoose = require('mongoose') // MongoDB ODM

// Schema for recording each failed login attempt
const FailedLoginAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Reference to the User who attempted login
  },
  ip: {
    type: String, // Client IP address at time of attempt
  },
  userAgent: {
    type: String, // User-Agent header from the client, for device/browser info
  },
  timestamp: {
    type: Date,
    default: Date.now, // Time when the failed login occurred
  },
})

// Export the model, stored in the 'failedloginattempts' collection
module.exports = mongoose.model('FailedLoginAttempt', FailedLoginAttemptSchema)
