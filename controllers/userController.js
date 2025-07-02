// controllers/userController.js

const User = require('../models/User')
const PASSWORD_REGEX =
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?!(?:.*[^A-Za-z0-9]){2,}).*$/

/**
 * @desc    Create a new user (admin only)
 * @route   POST /api/users
 * @access  Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, email } = req.body

    // 1) Prevent duplicate username/email
    const exists = await User.findOne({
      $or: [{ username }, { email }],
    })
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Username or email already in use.' })
    }

    // 2) Persist new user
    const user = new User(req.body)
    await user.save()

    // 3) Exclude password in response
    const userObj = user.toObject()
    delete userObj.password
    res.status(201).json(userObj)
  } catch (err) {
    // Handle duplicate key error explicitly
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({ message: `${field} already exists.` })
    }
    next(err)
  }
}

/**
 * @desc    Get list of all users
 * @route   GET /api/users
 * @access  Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Get a single user by ID
 * @route   GET /api/users/:id
 * @access  Admin
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Update a user and possibly change password
 * @route   PUT /api/users/:id
 * @access  Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    // 1) Handle password change if provided
    if (req.body.password) {
      // a) Prevent setting same password
      if (await user.comparePassword(req.body.password)) {
        return res
          .status(400)
          .json({ message: 'New password cannot match old password.' })
      }
      // b) Enforce password policy
      if (!PASSWORD_REGEX.test(req.body.password)) {
        return res.status(400).json({
          message:
            'Password must be ≥8 chars, include upper+lower case, max 1 special char.',
        })
      }
      // c) Assign, pre-save hook will hash
      user.password = req.body.password
    }

    // 2) Update other allowed fields
    const updatable = [
      'username',
      'email',
      'role',
      'provider',
      'providerId',
      'avatarUrl',
    ]
    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field]
      }
    })

    // 3) Save changes (triggers validation & hooks)
    const updated = await user.save()

    // 4) Exclude password in response
    const userObj = updated.toObject()
    delete userObj.password
    res.json(userObj)
  } catch (err) {
    // Duplicate key handling
    if (err.code === 11000 && err.keyPattern) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({ message: `${field} already exists.` })
    }
    next(err)
  }
}

/**
 * @desc    Delete a user by ID
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'User not found.' })
    }
    res.json({ message: 'User deleted.' })
  } catch (err) {
    next(err)
  }
}
