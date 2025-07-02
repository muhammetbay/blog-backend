const geoip = require('geoip-lite')
const Like = require('../models/Like')
const Post = require('../models/Post')

exports.likePost = async (req, res, next) => {
  try {
    const postId = req.params.id
    const userId = req.user ? req.user._id : null
    const visitorId = req.visitorId
    const ip = req.ip
    const geo = geoip.lookup(ip) || {}
    const country = geo.country || 'Unknown'

    // Zaten beğenmiş mi?
    const filter = userId
      ? { user: userId, post: postId }
      : { visitorId, post: postId }

    const exists = await Like.findOne(filter)
    if (exists) {
      return res.status(400).json({ message: 'Bu postu zaten beğendiniz.' })
    }

    // Like kaydet
    await Like.create({
      post: postId,
      user: userId,
      visitorId: userId ? undefined : visitorId,
      ip,
      country,
    })

    // likesCount güncelle
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } })

    res.status(201).json({ message: 'Post beğenildi.' })
  } catch (err) {
    next(err)
  }
}

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
      return res
        .status(400)
        .json({ message: 'Bu postu daha önce beğenmemişsiniz.' })
    }

    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } })

    res.json({ message: 'Beğeni kaldırıldı.' })
  } catch (err) {
    next(err)
  }
}

// GET /api/users/:id/likes
exports.getUserLikes = async (req, res, next) => {
  try {
    const userId = req.params.id
    // Kullanıcının beğendiklerini, post objeleriyle birlikte döner
    const likes = await Like.find({ user: userId }).populate('post')
    res.json(likes)
  } catch (err) {
    next(err)
  }
}
