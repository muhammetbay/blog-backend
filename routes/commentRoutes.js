// routes/commentRoutes.js
const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router({ mergeParams: true })
const commentController = require('../controllers/commentController.js')
const { protect } = require('../middleware/auth')

// Public: bir postun onaylı yorumlarını getir
router.get('/', commentController.getCommentsByPost)

// Authenticated: yeni yorum ekle
const commentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 1, // dakikada en fazla 5 yorum
  message: 'Dakikada en fazla 1 yorum yapabilirsiniz.',
  skipFailedRequests: true,
})
router.post('/', protect, commentLimiter, commentController.createComment)

// Authenticated: yorum güncelle & sil (owner veya admin)
router.put('/:id', protect, commentController.updateComment)
router.delete('/:id', protect, commentController.deleteComment)

module.exports = router
