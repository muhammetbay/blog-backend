// controllers/postController.js

const Post = require('../models/Post')
const emailQueueRedis = require('../utils/emailQueueRedis')

/**
 * @desc    Create a new post (admin or superadmin)
 * @route   POST /api/posts
 * @access  Admin|SuperAdmin
 */
exports.createPost = async (req, res, next) => {
  try {
    // 1) Persist new post with author and optional publishAt
    const post = await Post.create({
      ...req.body,
      author: req.user._id,
      publishedAt: req.body.isPublished ? Date.now() : null,
    })

    // 2) If published immediately, enqueue mail job
    if (post.isPublished) {
      await emailQueueRedis.add({ postId: post._id })
    }

    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Get published posts with filtering, pagination, search
 * @route   GET /api/posts
 * @access  Public
 */
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

/**
 * @desc    Get single post by slug and increment readCount
 * @route   GET /api/posts/:slug
 * @access  Public
 */
exports.getPostBySlug = async (req, res, next) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      isPublished: true,
    })
      .populate('author', 'username avatarUrl')
      .populate('category', 'name slug')

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' })
    }

    // Increment readCount
    post.readCount += 1
    await post.save()

    res.json(post)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Update a post (admin or superadmin)
 * @route   PUT /api/posts/:id
 * @access  Admin|SuperAdmin
 */
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' })
    }

    const wasPublished = post.isPublished
    Object.assign(post, req.body)

    // If newly published now, set publishedAt
    if (req.body.isPublished && !wasPublished) {
      post.publishedAt = Date.now()
    }

    const updated = await post.save()

    // Enqueue job only on new publish
    if (req.body.isPublished && !wasPublished) {
      await emailQueueRedis.add({ postId: updated._id })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Delete a post
 * @route   DELETE /api/posts/:id
 * @access  Admin|SuperAdmin
 */
exports.deletePost = async (req, res, next) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Post not found.' })
    }
    res.json({ message: 'Post deleted.' })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Admin-only: list all posts (any status)
 * @route   GET /api/posts/all
 * @access  Admin|SuperAdmin
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .populate('category', 'name slug')

    if (!posts.length) {
      return res.status(404).json({ message: 'No posts found.' })
    }
    res.json(posts)
  } catch (err) {
    next(err)
  }
}
