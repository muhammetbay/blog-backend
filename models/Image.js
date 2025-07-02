// models/Image.js

// Import dependency
const mongoose = require('mongoose')

// Define the schema for uploaded images / media
const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true, // Publicly accessible URL (S3 or local)
  },
  key: {
    type: String,
    required: true, // Storage key or filename for retrieval
  },
  size: {
    type: Number, // File size in bytes
  },
  mimeType: {
    type: String, // Content MIME type, e.g., 'image/jpeg'
  },
  createdAt: {
    type: Date,
    default: Date.now, // When the image record was created
  },
})

// Export the model (collection will be 'images')
module.exports = mongoose.model('Image', ImageSchema)
