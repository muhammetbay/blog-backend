// controllers/authController.js

const User = require('../models/User')
const FailedLoginAttempt = require('../models/FailedLoginAttempt')
const { signToken } = require('../utils/jwt')
const { sendWelcomeEmail } = require('../utils/emailService')
const Sentry = require('@sentry/node')

/**
 * @desc    Authenticate user and return a JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // 1) Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // 2) Allow only local-provider users for password login
    if (user.provider !== 'local') {
      return res
        .status(400)
        .json({ message: `Please login with ${user.provider}.` })
    }

    // 3) Compare provided password with stored hash
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      // a) Record failed login attempt for analysis
      await FailedLoginAttempt.create({
        user: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })
      // b) Increment failedLoginCount
      user.failedLoginCount = (user.failedLoginCount || 0) + 1
      await user.save()
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // 4) Increment login metrics and reset failed counters
    user.loginCount += 1
    user.lastLoginAt = Date.now()
    await user.save()

    // 5) Issue JWT
    const token = signToken(user._id)

    // 6) Return user object (excluding password)
    const userObj = user.toObject()
    delete userObj.password
    res.json({ token, user: userObj })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Register a new user and send a welcome email
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    // 1) Prevent duplicate username or email
    const exists = await User.findOne({
      $or: [{ username }, { email }],
    })
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Username or email already exists.' })
    }

    // 2) Create the user record
    const user = new User({
      username,
      email,
      password,
      provider: 'local',
      role: 'user',
    })
    await user.save()

    // 3) Fire-and-forget welcome email
    sendWelcomeEmail(email, username).catch(err =>
      console.error('Welcome email failed:', err)
    )

    // 4) Issue JWT
    const token = signToken(user._id)

    // 5) Return user object (excluding password)
    const userObj = user.toObject()
    delete userObj.password
    res.status(201).json({ token, user: userObj })
  } catch (err) {
    Sentry.captureException(err)
    next(err)
  }
}

/**
 * @desc    Get recent failed login attempts for the authenticated user
 * @route   GET /api/auth/failed-attempts
 * @access  Private
 */
exports.getFailedAttempts = async (req, res, next) => {
  try {
    const userId = req.user._id

    // 1) Fetch last 10 failed attempts
    const attempts = await FailedLoginAttempt.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('ip userAgent timestamp -_id')

    // 2) Fetch total failedLoginCount from user
    const user = await User.findById(userId).select('failedLoginCount')

    res.json({
      totalFailedAttempts: user.failedLoginCount,
      attempts,
    })
  } catch (err) {
    next(err)
  }
}
