// controllers/categoryController.js

const Category = require('../models/Category')

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body

    // 1) Prevent duplicate category names
    const exists = await Category.findOne({ name })
    if (exists) {
      return res.status(400).json({ message: 'This category already exists.' })
    }

    // 2) Create and return the new category
    const category = await Category.create({ name, description })
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    List all categories with post counts
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = async (req, res, next) => {
  try {
    // Aggregate to join with posts, count them, and sort by name
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'category',
          as: 'posts',
        },
      },
      {
        $addFields: { postCount: { $size: '$posts' } },
      },
      {
        $project: { posts: 0 },
      },
      {
        $sort: { name: 1 },
      },
    ])
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }
    res.json(category)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' })
    }

    // 1) If changing name, ensure no duplicate
    if (name && name !== category.name) {
      const exists = await Category.findOne({ name })
      if (exists) {
        return res
          .status(400)
          .json({ message: 'This category already exists.' })
      }
      category.name = name
    }

    // 2) Update description if provided
    if (description !== undefined) {
      category.description = description
    }

    // 3) Save and return
    const updated = await category.save()
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Category not found.' })
    }
    res.json({ message: 'Category deleted.' })
  } catch (err) {
    next(err)
  }
}
