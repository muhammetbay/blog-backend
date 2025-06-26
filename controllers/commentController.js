// controllers/commentController.js
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// 1) İngilizce için washyourmouthoutwithsoap
//    (çok-dilli küfür listesi sunuyor) :contentReference[oaicite:0]{index=0}
const wash = require('washyourmouthoutwithsoap')

// 2) Türkçe için turkish-profanity-filter
//    (Türkçe karakterleri doğru yakalıyor) :contentReference[oaicite:1]{index=1}
const TurkishProfanityFilter = require('turkish-profanity-filter')
const trFilter = new TurkishProfanityFilter()

const Comment = require('../models/Comment')

// 2.1. Bir posta ait yorumları getir (public)
export async function getCommentsByPost(req, res, next) {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
    res.json(comments)
  } catch (err) {
    next(err)
  }
}

// 2.2. Yeni yorum oluştur (authenticated)
export async function createComment(req, res, next) {
  try {
    const { content } = req.body
    // İngilizce kontrol
    const hasEnProfanity = wash.check('en', content)
    // Türkçe kontrol
    const hasTrProfanity = trFilter.check(content)
    if (hasEnProfanity || hasTrProfanity) {
      return res
        .status(400)
        .json({ message: 'Yorumunuz uygunsuz içerik barındırıyor.' })
    }

    // İstersen temizlenmiş versiyonunu da kaydet:
    // const cleanContent = filter.clean(content);

    const comment = await Comment.create({
      author: req.user._id,
      post: req.params.postId,
      content,
    })
    res.status(201).json(comment)
  } catch (err) {
    next(err)
  }
}

// 2.3. Yorum güncelle (sadece sahibine veya admin/superadmin’e)
export async function updateComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı.' })

    // Sahip kontrolü
    const isOwner = comment.author.equals(req.user._id)
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role)
    if (!(isOwner || isAdmin)) {
      return res
        .status(403)
        .json({ message: 'Bu yorumu düzenleme yetkiniz yok.' })
    }

    comment.content = req.body.content || comment.content

    // -- Burada profanite kontrolü başlıyor --
    if (comment.content !== undefined) {
      const hasEnProfanity = wash.check('en', comment.content)
      const hasTrProfanity = trFilter.check(comment.content)
      if (hasEnProfanity || hasTrProfanity) {
        return res
          .status(400)
          .json({ message: 'Yorumunuz uygunsuz içerik barındırıyor.' })
      }
    }
    // -- Profanite kontrolü bitti --

    const updated = await comment.save()
    res.json(updated)
  } catch (err) {
    next(err)
  }
}

// 2.4. Yorum sil (sahibine veya admin/superadmin’e)
export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Yorum bulunamadı.' })

    const isOwner = comment.author.equals(req.user._id)
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role)
    if (!(isOwner || isAdmin)) {
      return res.status(403).json({ message: 'Bu yorumu silme yetkiniz yok.' })
    }

    await comment.deleteOne()
    res.json({ message: 'Yorum silindi.' })
  } catch (err) {
    next(err)
  }
}

// 2.5. Tüm yorumları admin için listele
export async function getAllComments(req, res, next) {
  try {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('post', 'title slug')
    res.json(comments)
  } catch (err) {
    next(err)
  }
}
