const mongoose = require('mongoose')

const LikeSchema = new mongoose.Schema({
  // Üye ise user, değilse visitorId
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  visitorId: {
    type: String,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  ip: {
    type: String,
  },
  country: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Herkes için ayrı ayrı eşsiz: user+post veya visitorId+post
LikeSchema.index(
  { user: 1, post: 1 },
  { unique: true, partialFilterExpression: { user: { $exists: true } } }
)
LikeSchema.index(
  { visitorId: 1, post: 1 },
  { unique: true, partialFilterExpression: { visitorId: { $exists: true } } }
)

module.exports = mongoose.model('Like', LikeSchema)
