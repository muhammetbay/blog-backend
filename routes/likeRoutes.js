const express = require('express')
const { protect } = require('../middleware/auth')
const {
  likePost,
  unlikePost,
  getUserLikes,
} = require('../controllers/likeController')

const router = express.Router()

// Beğen
router.post('/posts/:id/like', protect, likePost)

// Beğeniyi kaldır
router.delete('/posts/:id/like', protect, unlikePost)

// Bir kullanıcının beğenileri
router.get('/users/:id/likes', protect, getUserLikes)

module.exports = router
