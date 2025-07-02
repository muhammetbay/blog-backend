// models/Post.js

// Import dependencies
const mongoose = require('mongoose')
const slugify = require('slugify')

// Define the schema for blog posts
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // Each post needs a title
      trim: true,
    },
    excerpt: {
      type: String,
      default: '', // Short summary, auto-generated if empty
    },
    slug: {
      type: String,
      required: true, // Used in post URLs
      unique: true,
    },
    coverImageUrl: {
      type: String,
      default: '', // URL to the post's cover image
    },
    content: {
      type: String,
      required: true, // Full post body
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Reference to the Category model
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true, // Simple string tags
      },
    ],
    readCount: {
      type: Number,
      default: 0, // How many times the post has been read
    },
    likesCount: {
      type: Number,
      default: 0, // Number of likes
    },
    isPublished: {
      type: Boolean,
      default: false, // Publish status
    },
    publishedAt: {
      type: Date, // Timestamp when post was published
    },
    metaTitle: {
      type: String,
      default: '', // SEO: meta title override
    },
    metaDescription: {
      type: String,
      default: '', // SEO: meta description override
    },
    metaKeywords: [
      {
        type: String,
        trim: true, // SEO: meta keywords list
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Before validation (on create or title change), auto-generate slug & excerpt
PostSchema.pre('validate', function (next) {
  if (this.isModified('title')) {
    // Create URL-friendly slug from title
    this.slug = slugify(this.title, { lower: true, strict: true })
  }
  if (!this.excerpt && this.isModified('content')) {
    // Auto-generate excerpt from first 200 chars of content
    this.excerpt = this.content.substring(0, 200) + '...'
  }
  next()
})

// Export the model (collection will be 'posts')
module.exports = mongoose.model('Post', PostSchema)
