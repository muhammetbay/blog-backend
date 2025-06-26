// controllers/categoryController.js
const Category = require('../models/Category')

// Yeni kategori oluştur (admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body

    // Duplicate name kontrolü
    const exists = await Category.findOne({ name })
    if (exists) {
      return res.status(400).json({ message: 'Bu kategori zaten mevcut.' })
    }

    const category = await Category.create({ name, description })
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

// Tüm kategorileri listele (public)
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.aggregate([
      // 1) Post koleksiyonundan kendi ID’mle eşleşenleri al
      {
        $lookup: {
          from: 'posts', // MongoDB’de collection adı
          localField: '_id', // Category._id
          foreignField: 'category', // Post.category
          as: 'posts',
        },
      },
      // 2) posts array’inin boyutunu postCount alanına ekle
      {
        $addFields: {
          postCount: { $size: '$posts' },
        },
      },
      // 3) posts array’ini istemiyorsak projekte etmeyelim
      {
        $project: { posts: 0 },
      },
      // 4) İsim sırasına göre sırala
      { $sort: { name: 1 } },
    ])
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

// Tek bir kategori getir (public)
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' })
    }
    res.json(category)
  } catch (err) {
    next(err)
  }
}

// Kategori güncelle (admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' })
    }

    if (name && name !== category.name) {
      // Duplicate name kontrolü
      const exists = await Category.findOne({ name })
      if (exists) {
        return res.status(400).json({ message: 'Bu kategori zaten mevcut.' })
      }
      category.name = name
    }
    if (description !== undefined) {
      category.description = description
    }

    const updated = await category.save()
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// Kategori sil (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' })
    }
    res.json({ message: 'Kategori silindi.' })
  } catch (err) {
    next(err)
  }
}
