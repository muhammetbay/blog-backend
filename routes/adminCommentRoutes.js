// routes/adminCommentRoutes.js
const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController.js')
const { protect, admin, superAdmin } = require('../middleware/auth')

// Sadece admin/superadmin tüm yorumları görebilsin
router.get('/', protect, superAdmin, commentController.getAllComments)

module.exports = router
