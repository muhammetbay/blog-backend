const express = require('express')
const { getPostSeo } = require('../controllers/seoController')
const router = express.Router()

// GET /api/seo/posts/:slug
router.get('/posts/:slug', getPostSeo)

module.exports = router
