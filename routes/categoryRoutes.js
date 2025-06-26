// routes/categoryRoutes.js
const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const { protect, superAdmin } = require('../middleware/auth')

// Public
router.get('/', categoryController.getCategories)
router.get('/:id', categoryController.getCategoryById)

// Admin-only
router.post('/', protect, superAdmin, categoryController.createCategory)
router.put('/:id', protect, superAdmin, categoryController.updateCategory)
router.delete('/:id', protect, superAdmin, categoryController.deleteCategory)

module.exports = router
