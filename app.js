// app.js
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const { swaggerOptions } = require('./swagger.js')

// require('./utils/agenda')
require('./utils/emailQueeRedis')

const categoryRoutes = require('./routes/categoryRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')
const commentRoutes = require('./routes/commentRoutes')
const adminCommentRoutes = require('./routes/adminCommentRoutes')
const mediaRoutes = require('./routes/mediaRoutes')

const { protect, admin, superAdmin } = require('./middleware/auth')
// const configRoutes   = require('./routes/configRoutes');

const app = express()
const PORT = process.env.PORT || 5000

// --- Middleware ---
app.use(cors())
app.use(express.json())

// --- Swagger Setup ---
const specs = swaggerJsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// --- Healthcheck Endpoint ---
app.get('/', (req, res) => {
  res.send('Merhaba Bay! Backend çalışıyor.')
})

// Auth katmanı
app.use('/api/auth', authRoutes)

// --- Route Mounting ---
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/categories', categoryRoutes)
// **Yorumlar** (post’a bağlı)
app.use('/api/posts/:postId/comments', commentRoutes)

// **Admin Yorum Yönetimi**
app.use('/api/comments', adminCommentRoutes)

app.use('/api/media', mediaRoutes)

// app.use('/api/config', configRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint bulunamadı.' })
})

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err)
  // Duplicate key error (11000) için özel mesaj
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0]
    return res
      .status(400)
      .json({ message: `Aynı ${field} ile ikinci kez kayıt yapılamaz.` })
  }
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Sunucu hatası.' })
})

// --- MongoDB Bağlantısı ve Sunucu Başlatma ---
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı.')
    app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor.`)
    })
  })
  .catch(err => {
    console.error('MongoDB bağlantı hatası:', err)
    process.exit(1)
  })
