// models/User.js

// --------------------
// 1. Module Imports
// --------------------
const mongoose = require('mongoose') // MongoDB object modeling
const bcrypt = require('bcryptjs') // Password hashing

// Password validation regex:
// - Minimum 8 characters
// - At least one uppercase and one lowercase letter
// - At most one special character (others alphanumeric)
const PASSWORD_REGEX =
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?!(?:.*[^A-Za-z0-9]){2,}).*$/

// --------------------
// 2. User Schema Definition
// --------------------
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true, // Username is required
      unique: true, // Must be unique
      trim: true, // Trim whitespace from both ends
    },
    email: {
      type: String,
      required: true, // Email is required
      unique: true, // Must be unique
      lowercase: true, // Convert to lowercase before saving
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Only required when using local auth
        return this.provider === 'local'
      },
      validate: {
        validator: function (pw) {
          // Skip validation if password not modified
          if (!this.isModified('password')) return true
          // Validate against regex
          return PASSWORD_REGEX.test(pw)
        },
        message:
          'Password must be at least 8 chars, include upper & lower case, and at most 1 special character.',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super'], // Allowed roles
      default: 'user', // Default role
    },
    provider: {
      type: String,
      enum: ['local', 'google'], // Auth providers
      default: 'local',
    },
    providerId: {
      type: String, // External provider ID for OAuth
    },
    avatarUrl: {
      type: String, // URL of the user's avatar image
    },
    loginCount: {
      type: Number,
      default: 0, // Number of successful logins
    },
    lastLoginAt: {
      type: Date, // Timestamp of last login
    },
    failedLoginCount: {
      type: Number,
      default: 0, // Number of failed login attempts
    },
  },
  {
    timestamps: true, // Automatically add createdAt & updatedAt
  }
)

// --------------------
// 3. Pre-save Hook
// --------------------
// Hash password before saving if it has been modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// --------------------
// 4. Pre-findOneAndUpdate Hook
// --------------------
// Hash password when updating via findOneAndUpdate
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate()
  if (update.password) {
    const salt = await bcrypt.genSalt(10)
    update.password = await bcrypt.hash(update.password, salt)
    this.setUpdate(update)
  }
  next()
})

// --------------------
// 5. Instance Method: comparePassword
// --------------------
// Compare a given password with the stored hash
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// --------------------
// 6. Model Export
// --------------------
// Export the User model based on UserSchema
module.exports = mongoose.model('User', UserSchema)
