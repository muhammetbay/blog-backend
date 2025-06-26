// controllers/userController.js
const User = require('../models/User')

const PASSWORD_REGEX =
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?!(?:.*[^A-Za-z0-9]){2,}).*$/

exports.createUser = async (req, res, next) => {
  try {
    const { username, email } = req.body
    // 1) Duplicate kontrolü
    const exists = await User.findOne({
      $or: [{ username }, { email }],
    })
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor.' })
    }
    // 2) Yeni kullanıcıyı oluştur
    const user = new User(req.body)
    await user.save()
    // Şifreyi döndürme
    const userObj = user.toObject()
    delete userObj.password
    res.status(201).json(userObj)
  } catch (err) {
    // 3) Yine de 11000 gelirse global handler yerine buradan belirt
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({ message: `${field} değeri zaten mevcut.` })
    }
    next(err)
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    next(err)
  }
}

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' })
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    // 1) Kullanıcıyı bul
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' })
    }

    // 2) Şifre güncellemesi varsa önden policy kontrolü
    if (req.body.password) {
      const newPassword = req.body.password

      // 2a) Yeni şifre mevcut şifreyle aynı mı?
      const isSame = await user.comparePassword(newPassword)
      if (isSame) {
        return res
          .status(400)
          .json({ message: 'Yeni şifre mevcut şifreyle aynı olamaz.' })
      }

      // 2b) Şifre politikası validasyonu
      if (!PASSWORD_REGEX.test(newPassword)) {
        return res.status(400).json({
          message:
            'Şifre en az 8 karakter, en az bir büyük/küçük harf içermeli ve en fazla 1 özel karaktere izin veriyor.',
        })
      }

      // 2c) Yeni şifreyi set et (pre-save hook’unda hash’lenecek)
      user.password = newPassword
    }

    // 3) Diğer alanları set et
    const updatableFields = [
      'username',
      'email',
      'role',
      'provider',
      'providerId',
      'avatarUrl',
    ]
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field]
      }
    })

    // 4) Save ile hem hash hem de validate tetiklenir
    const updated = await user.save()

    // 5) Şifreyi dönme
    const userObj = updated.toObject()
    delete userObj.password
    res.json(userObj)
  } catch (err) {
    // 11000 duplicate key vs.
    if (err.code === 11000 && err.keyPattern) {
      const field = Object.keys(err.keyPattern)[0]
      return res.status(400).json({ message: `${field} değeri zaten mevcut.` })
    }
    next(err)
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' })
    }
    res.json({ message: 'Kullanıcı silindi.' })
  } catch (err) {
    next(err)
  }
}
