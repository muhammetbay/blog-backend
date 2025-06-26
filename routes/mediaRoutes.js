// routes/mediaRoutes.js
const express = require('express')
const { protect, admin, superAdmin } = require('../middleware/auth')
const { uploadLocal, uploadMemory } = require('../middleware/upload')
const {
  uploadImageLocal,
  uploadImageS3,
} = require('../controllers/mediaController')

const router = express.Router()

// Lokal upload (test/geliştirme)
router.post(
  '/local',
  protect,
  superAdmin,
  uploadLocal.single('image'),
  uploadImageLocal
)

// S3 upload (prodüksiyon)
router.post(
  '/s3',
  protect,
  superAdmin,
  uploadMemory.single('image'),
  uploadImageS3
)

module.exports = router
