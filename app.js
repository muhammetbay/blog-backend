// app.js

// --------------------
// 1. Environment Setup
// --------------------
// Determine the current environment (development, test, production)
// and load the corresponding .env file.
const env = process.env.NODE_ENV || 'development'
require('dotenv').config({ path: `.env.${env}` })

// --------------------
// 2. Dependencies
// --------------------
const express = require('express') // Web framework
const cookieParser = require('cookie-parser') // Parse cookies for visitorId
const { v4: uuidv4 } = require('uuid') // Generate unique IDs
const cors = require('cors') // Enable CORS
const mongoose = require('mongoose') // MongoDB ODM
const Sentry = require('@sentry/node') // Error monitoring
const swaggerJsdoc = require('swagger-jsdoc') // Swagger spec generator
const swaggerUi = require('swagger-ui-express') // Swagger UI middleware
const logger = require('./utils/logger') // Winston logger

// Initialize background jobs / queues
// require('./utils/agenda');
require('./utils/emailQueueRedis')

// Metrics utilities for Prometheus
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
const likeRoutes = require('./routes/likeRoutes')
const seoRoutes = require('./routes/seoRoutes')

// --------------------
// 4. Sentry Initialization
// --------------------
// Configure Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: env,
  tracesSampleRate: 0.1,
})

// --------------------
// 5. Express App Setup
// --------------------
const app = express()

// 5.0 Cookie Parser
// Parse cookies on incoming requests to read/write visitorId cookie
app.use(cookieParser())

// 5.0 Visitor ID Middleware
// Assign a unique visitorId cookie to anonymous visitors
app.use((req, res, next) => {
  let visitorId = req.cookies.visitorId
  if (!visitorId) {
    // Generate and set a new UUID cookie valid for 1 year
    visitorId = uuidv4()
    res.cookie('visitorId', visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    })
  }
  req.visitorId = visitorId
  next()
})

// 5.1 Request Logging (Winston)
// Log every incoming HTTP request for audit and debugging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`)
  next()
})

// 5.2 Core Middleware
app.use(cors()) // Enable Cross-Origin Resource Sharing
app.use(express.json()) // Parse JSON request bodies

// 5.2 Metrics Middleware
// Count and time each HTTP request for Prometheus scraping
app.use((req, res, next) => {
  // Start timer for this request
  const end = httpRequestDuration.startTimer()
  res.on('finish', () => {
    // Determine route path (fallback to raw URL)
    const route = req.route ? req.route.path : req.path

    // Increment total request counter
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status: res.statusCode,
    })

    // Record duration in histogram
    end({
      method: req.method,
      route,
      status: res.statusCode,
    })
  })
  next()
})

// 5.3 Swagger UI (API Documentation)
// Generate and serve OpenAPI docs at /api-docs
const specs = swaggerJsdoc(require('./swagger.js').swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// --------------------
// 6. Public Endpoints
// --------------------
// Health check endpoint
app.get('/', (req, res) => {
  res.send('Merhaba Bay! Backend is up and running.')
})

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (err) {
    logger.error('Metrics endpoint error', err)
    res.status(500).send('Metrics collection error')
  }
})

// --------------------
// 7. API Routes
// --------------------
// Mount all feature-specific routers under /api
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts/:postId/comments', commentRoutes)
app.use('/api/comments', adminCommentRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api', likeRoutes)
app.use('/api/seo', seoRoutes)

// --------------------
// 8. Test Routes
// --------------------
// Quick endpoints for manual testing of logging and error handling

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

// Another Sentry debug endpoint
app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('My first Sentry error!')
})

// Error rate test (returns 500)
app.get('/test/error-rate', (req, res) => {
  res.status(500).send('Forced error')
})

// Slow endpoint test (2s delay)
app.get('/test/slow', async (req, res) => {
  await new Promise(r => setTimeout(r, 2000))
  res.send('OK')
})

// --------------------
// 9. Sentry Error Handler
// --------------------
// Capture uncaught exceptions and report to Sentry
Sentry.setupExpressErrorHandler(app)

// --------------------
// 10. 404 Handler
// --------------------
// Catch-all for routes not matched above
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' })
})

// --------------------
// 11. Global Error Handler
// --------------------
// Log the error and handle known cases like Mongo duplicate key
app.use((err, req, res, next) => {
  logger.error(err)

  // Handle MongoDB duplicate key error
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(400).json({ message: `Duplicate ${field} not allowed.` })
  }

  // Generic error response
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal Server Error.' })
})

// --------------------
// 12. Database Connection & Server Start
// --------------------
// Connect to MongoDB and then start the server
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
