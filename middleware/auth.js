// middleware/auth.js
const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.protect = async (req, res, next) => {
  let token
  // Authorization header’dan Bearer token’ı al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Token bulunamadı, yetkisiz erişim.' })
  }

  try {
    // Token doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Kullanıcıyı al (parolayı geri verme)
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' })
    }
    next()
  } catch (err) {
    console.error(err)
    return res
      .status(401)
      .json({ message: 'Token geçersiz veya süresi dolmuş.' })
  }
}

exports.admin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next()
  } else {
    return res
      .status(403)
      .json({ message: 'Bu işlemi yapabilmek için admin yetkisi gerekli.' })
  }
}

exports.superAdmin = (req, res, next) => {
  if (req.user.role === 'super') {
    next()
  } else {
    return res.status(403).json({
      message: 'Bu işlemi yapabilmek için super admin yetkisi gerekli.',
    })
  }
}
