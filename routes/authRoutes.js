/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication Endpoints
 */

const express = require('express')
const router = express.Router()
const {
  login,
  register,
  getFailedAttempts,
} = require('../controllers/authController')
const { protect, admin, superAdmin } = require('../middleware/auth')

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Adds new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Kayıt başarılı, token ve user objesi döner
 *       "400":
 *         description: Geçersiz input veya duplicate
 */
router.post('/register', register)
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Adds new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Giriş başarılı, token ve user objesi döner
 *       "400":
 *         description: Geçersiz input veya duplicate
 */
router.post('/login', login)

// İleride eklenecek Google OAuth için placeholder
// router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));
// router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

router.get('/failed-attempts', protect, getFailedAttempts)

module.exports = router
