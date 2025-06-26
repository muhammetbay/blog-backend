// routes/postRoutes.js
const express = require('express')
const router = express.Router()
const postController = require('../controllers/postController')
const { protect, admin, superAdmin } = require('../middleware/auth')

// Public
router.get('/', postController.getPosts)
router.get('/all', protect, superAdmin, postController.getAllPosts)
router.get('/:slug', postController.getPostBySlug)

// Admin/Superadmin
router.post('/', protect, superAdmin, postController.createPost)
router.put('/:id', protect, superAdmin, postController.updatePost)
router.delete('/:id', protect, superAdmin, postController.deletePost)

module.exports = router
