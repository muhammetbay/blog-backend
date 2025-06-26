// models/Image.js
const mongoose = require('mongoose')

const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  key: {
    type: String, // S3 key veya lokal dosya adı
    required: true,
  },
  size: {
    type: Number, // bayt cinsinden
  },
  mimeType: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Image', ImageSchema)
