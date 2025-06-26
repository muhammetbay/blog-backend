// routes/userRoutes.js
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { protect, admin, superAdmin } = require('../middleware/auth')

// Create
router.post('/', protect, superAdmin, userController.createUser)
// Read all
router.get('/', protect, superAdmin, userController.getUsers)
// Read one
router.get('/:id', protect, superAdmin, userController.getUserById)
// Update
router.put('/:id', protect, superAdmin, userController.updateUser)
// Delete
router.delete('/:id', protect, superAdmin, userController.deleteUser)

module.exports = router
