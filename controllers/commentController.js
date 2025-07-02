// controllers/commentController.js

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const wash = require('washyourmouthoutwithsoap')
const TurkishProfanityFilter = require('turkish-profanity-filter')
const trFilter = new TurkishProfanityFilter()
const Comment = require('../models/Comment')

/**
 * @desc    Get flat list of approved comments for a post
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
export async function getCommentsByPost(req, res, next) {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
    res.json(comments)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Get threaded (nested) comments for a post
 * @route   GET /api/posts/:postId/comments/tree
 * @access  Public
 */
export async function getCommentsTree(req, res, next) {
  try {
    const postId = req.params.postId
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .lean()

    // Build a map of id→comment and attach children arrays
    const map = {}
    comments.forEach(c => {
      c.children = []
      map[c._id.toString()] = c
    })

    // Assemble tree
    const tree = []
    comments.forEach(c => {
      if (c.parent) {
        const parent = map[c.parent.toString()]
        if (parent) parent.children.push(c)
      } else {
        tree.push(c)
      }
    })

    res.json(tree)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Create a new comment (top-level or reply)
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
export async function createComment(req, res, next) {
  try {
    const { content, parent } = req.body
    const postId = req.params.postId

    // 1) Profanity check in both languages
    if (wash.check('en', content) || trFilter.check(content)) {
      return res
        .status(400)
        .json({ message: 'Your comment contains inappropriate content.' })
    }

    // 2) If replying, ensure parent exists on same post
    if (parent) {
      const parentComment = await Comment.findById(parent)
      if (!parentComment || parentComment.post.toString() !== postId) {
        return res.status(400).json({ message: 'Invalid parent comment.' })
      }
    }

    // 3) Save the comment
    const comment = await Comment.create({
      author: req.user._id,
      post: postId,
      content,
      parent: parent || null,
    })
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Update a comment (owner or admin only)
 * @route   PUT /api/comments/:id
 * @access  Private
 */
export async function updateComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' })
    }

    // Authorization: owner or super-admin
    const isOwner = comment.author.equals(req.user._id)
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role)
    if (!(isOwner || isAdmin)) {
      return res
        .status(403)
        .json({ message: 'Not authorized to edit this comment.' })
    }

    const newContent = req.body.content
    if (newContent !== undefined) {
      // Profanity check on update
      if (wash.check('en', newContent) || trFilter.check(newContent)) {
        return res
          .status(400)
          .json({ message: 'Your comment contains inappropriate content.' })
      }
      comment.content = newContent
    }

    const updated = await comment.save()
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Delete a comment (owner or admin only)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' })
    }
    const isOwner = comment.author.equals(req.user._id)
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role)
    if (!(isOwner || isAdmin)) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this comment.' })
    }

    await comment.deleteOne()
    res.json({ message: 'Comment deleted.' })
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Admin-only: list all comments across posts
 * @route   GET /api/comments
 * @access  SuperAdmin
 */
export async function getAllComments(req, res, next) {
  try {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('post', 'title slug')
    res.json(comments)
  } catch (err) {
    next(err)
  }
}
