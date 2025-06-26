// controllers/postController.js
const Post = require('../models/Post')
// const agenda = require('../utils/agenda')
const emailQueeRedis = require('../utils/emailQueeRedis')

// Yeni post oluştur (admin/superadmin)
exports.createPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user._id,
      publishedAt: req.body.isPublished ? Date.now() : null,
    })
    // Eğer yayınlandıysa, job ekle
    if (post.isPublished) {
      // await agenda.now('notify-post-published', { postId: post._id })
      // For Redis Mail Quee
      await emailQueeRedis.add({ postId: post._id })
    }
    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
}

// Post listesini getir (public), kategori/sayfalama/arama destekli
exports.getPosts = async (req, res, next) => {
  try {
    const { category, tag, page = 1, limit = 10, search } = req.query
    const filter = { isPublished: true }

    if (category) filter.category = category
    if (tag) filter.tags = tag
    if (search) filter.$text = { $search: search }

    const posts = await Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('author', 'username avatarUrl')
      .populate('category', 'name slug')

    res.json(posts)
  } catch (err) {
    next(err)
  }
}

// Tek post’u slug’a göre getir (public)
exports.getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      isPublished: true,
    })
      .populate('author', 'username avatarUrl')
      .populate('category', 'name slug')
    if (!post) {
      return res.status(404).json({ message: 'Post bulunamadı.' })
    }
    // okunma sayısını arttır
    post.readCount += 1
    await post.save()
    res.json(post)
  } catch (err) {
    next(err)
  }
}

// Post güncelle (admin/superadmin)
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Post bulunamadı.' })
    }
    const wasPublished = post.isPublished
    Object.assign(post, req.body)
    if (req.body.isPublished && !wasPublished) {
      post.publishedAt = Date.now()
    }
    const updated = await post.save()
    // Sadece “yeni” olarak yayınlandığında job ekle
    if (req.body.isPublished && !wasPublished) {
      // await agenda.now('notify-post-published', { postId: updated._id })
      // For Redis Mail Quee
      await emailQueeRedis.add({ postId: updated._id })
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// Post sil (admin/superadmin)
exports.deletePost = async (req, res, next) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Post bulunamadı.' })
    }
    res.json({ message: 'Post silindi.' })
  } catch (err) {
    next(err)
  }
}

exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate('category', 'name slug')

    if (!posts.length) {
      return res.status(404).json({ message: 'Hiç post bulunamadı.' })
    }

    res.json(posts)
  } catch (err) {
    next(err)
  }
}
