// app.js

// --------------------
// 1. Environment Setup
// --------------------
const env = process.env.NODE_ENV || 'development'
require('dotenv').config({ path: `.env.${env}` })

// --------------------
// 2. Dependencies
// --------------------
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Sentry = require('@sentry/node')
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const logger = require('./utils/logger')
// initialize background jobs / queues
// require('./utils/agenda');
require('./utils/emailQueeRedis')

const {
  client,
  httpRequestsTotal,
  httpRequestDuration,
} = require('./utils/metrics')

// --------------------
// 3. Route Modules
// --------------------
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const postRoutes = require('./routes/postRoutes')
const commentRoutes = require('./routes/commentRoutes')
const adminCommentRoutes = require('./routes/adminCommentRoutes')
const mediaRoutes = require('./routes/mediaRoutes')

// --------------------
// 4. Sentry Initialization
// --------------------
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: env,
  tracesSampleRate: 0.1,
})

// --------------------
// 5. Express App Setup
// --------------------
const app = express()

// 5.1. Request Logging (Winston)
//    logs every incoming request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`)
  next()
})

// 5.2. Core Middleware
app.use(cors())
app.use(express.json())

// Metrics middleware: her isteği sayar ve süresini ölçer
app.use((req, res, next) => {
  // Timer’ı başlat
  const end = httpRequestDuration.startTimer()

  res.on('finish', () => {
    // Express route path’i yoksa raw path kullan
    const route = req.route ? req.route.path : req.path

    // Sayaç artışı
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    })

    // Süre gözlemi
    end({
      method: req.method,
      route,
      status: res.statusCode,
    })
  })

  next()
})

// 5.3. Swagger UI (API Documentation)
const specs = swaggerJsdoc(require('./swagger.js').swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// --------------------
// 6. Public Endpoints
// --------------------
// Health check
app.get('/', (req, res) => {
  res.send('Merhaba Bay! Backend is up and running.')
})

// Prometheus’un scrape edeceği metrikler
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (err) {
    logger.error('Metrics endpoint hatası', err)
    res.status(500).send('Metrics toplama hatası')
  }
})

// --------------------
// 7. API Routes
// --------------------
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts/:postId/comments', commentRoutes)
app.use('/api/comments', adminCommentRoutes)
app.use('/api/media', mediaRoutes)

// --------------------
// 8. Test Routes
// --------------------
// Winston log test
app.get('/test/log', (req, res) => {
  logger.info('ℹ️ INFO level test log')
  logger.warn('⚠️ WARN level test log')
  logger.error('❌ ERROR level test log')
  res.send('Winston test logs have been written.')
})

// Sentry error test
app.get('/test/sentry', (req, res) => {
  throw new Error('🧪 Sentry test error')
})

app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!')
})

app.get('/test/error-rate', (req, res) => {
  res.status(500).send('Forced error')
})

app.get('/test/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 2000))
  res.send('OK')
})

// --------------------
// 9. Sentry Error Handler
// --------------------
// For @sentry/node v8: use setupExpressErrorHandler
Sentry.setupExpressErrorHandler(app)

// --------------------
// 10. 404 Handler
// --------------------
// Catches any request that didn't match above routes
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' })
})

// --------------------
// 11. Global Error Handler
// --------------------
// Logs the error via Winston, handles duplicate-key errors, then responds
app.use((err, req, res, next) => {
  logger.error(err)

  // MongoDB duplicate key
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(400).json({ message: `Duplicate ${field} not allowed.` })
  }

  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal Server Error.' })
})

// --------------------
// 12. Database Connection & Server Start
// --------------------
const PORT = process.env.PORT || 5000
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connection successful.')
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}.`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
