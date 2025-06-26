// utils/jwt.js
const jwt = require('jsonwebtoken')

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.SESSION_TTL,
  })
}

module.exports = { signToken }
