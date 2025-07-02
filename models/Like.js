// models/Like.js

// Import dependency
const mongoose = require('mongoose')

// Define the schema for likes (tracks both users and anonymous visitors)
const LikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // If logged-in, reference to the user
  },
  visitorId: {
    type: String, // If anonymous, unique visitor cookie ID
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', // Which post was liked
    required: true,
  },
  ip: {
    type: String, // IP address of the liker
  },
  country: {
    type: String, // Country derived from IP (geoip)
  },
  createdAt: {
    type: Date,
    default: Date.now, // When the like occurred
  },
})

// Ensure unique like per post per user or per visitor
LikeSchema.index(
  { user: 1, post: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $exists: true } },
  }
)
LikeSchema.index(
  { visitorId: 1, post: 1 },
  {
    unique: true,
    partialFilterExpression: { visitorId: { $exists: true } },
  }
)

// Export the model (collection will be 'likes')
module.exports = mongoose.model('Like', LikeSchema)
