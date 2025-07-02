// models/Category.js

// Import dependencies
const mongoose = require('mongoose')
const slugify = require('slugify')

// Define the schema for blog categories
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Category must have a name
      unique: true, // Names must be unique
      trim: true, // Trim whitespace around the name
    },
    slug: {
      type: String,
      required: true, // Slug is required (used in URLs)
      unique: true, // Slugs must be unique
    },
    description: {
      type: String,
      default: '', // Optional human-readable description
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
)

// Before validating (on create or name change), generate the slug
CategorySchema.pre('validate', function (next) {
  // If the name was modified or it's a new document
  if (this.isModified('name')) {
    // Create a URL-friendly slug from the category name
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
  next()
})

// Export the model (collection will be 'categories')
module.exports = mongoose.model('Category', CategorySchema)
