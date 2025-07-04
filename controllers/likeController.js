// controllers/likeController.js

const geoip = require('geoip-lite')
const Like = require('../models/Like')
const Post = require('../models/Post')

/**
 * @desc    Like a post (logged-in or visitor)
 * @route   POST /api/posts/:id/like
 * @access  Public or Authenticated
 */
exports.likePost = async (req, res, next) => {
  try {
    const postId = req.params.id
    const userId = req.user ? req.user._id : null
    const visitorId = req.visitorId
    const ip = req.ip
    const geo = geoip.lookup(ip) || {}
    const country = geo.country || 'Unknown'

    // 1) Prevent duplicate like by same user or visitor
    const filter = userId
      ? { user: userId, post: postId }
      : { visitorId, post: postId }
    if (await Like.findOne(filter)) {
      return res.status(400).json({ message: 'You already liked this post.' })
    }

    // 2) Persist like record
    await Like.create({
      post: postId,
      user: userId,
      visitorId: userId ? undefined : visitorId,
      ip,
      country,
    })

    // 3) Increment post.likesCount
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } })

    res.status(201).json({ message: 'Post liked.' })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Unlike a post
 * @route   DELETE /api/posts/:id/like
 * @access  Public or Authenticated
 */
exports.unlikePost = async (req, res, next) => {
  try {
    const postId = req.params.id
    const userId = req.user ? req.user._id : null
    const visitorId = req.visitorId

    const filter = userId
      ? { user: userId, post: postId }
      : { visitorId, post: postId }
    const like = await Like.findOneAndDelete(filter)

    if (!like) {
      return res.status(400).json({ message: 'You have not liked this post.' })
    }

    // Decrement post.likesCount
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } })

    res.json({ message: 'Like removed.' })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Get likes for a specific user
 * @route   GET /api/users/:id/likes
 * @access  Private
 */
exports.getUserLikes = async (req, res, next) => {
  try {
    const userId = req.params.id
    const likes = await Like.find({ user: userId }).populate('post')
    res.json(likes)
  } catch (err) {
    next(err)
  }
}
