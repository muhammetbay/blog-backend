// utils/metrics.js

const client = require('prom-client')

// 1) Collect built-in Node.js metrics (CPU, memory, GC, etc.)
client.collectDefaultMetrics()

// 2) Define an HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
})

// 3) Define an HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  // customize buckets as needed
  buckets: [0.1, 0.5, 1, 2, 5],
})

module.exports = {
  client,
  httpRequestsTotal,
  httpRequestDuration,
}
