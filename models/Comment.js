// models/Comment.js

// Import dependency
const mongoose = require('mongoose')

// Define the schema for comments (supports threaded replies)
const CommentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Who wrote the comment
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Which post this comment belongs to
      required: true,
    },
    content: {
      type: String,
      required: true, // The textual content of the comment
      trim: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment', // Reference to parent comment for threading
      default: null, // null indicates a top-level comment
    },
    isApproved: {
      type: Boolean,
      default: true, // Future: use for moderation workflows
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
)

// Export the model (collection will be 'comments')
module.exports = mongoose.model('Comment', CommentSchema)
