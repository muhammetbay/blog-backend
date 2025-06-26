// controllers/authController.js
const User = require('../models/User')
const FailedLoginAttempt = require('../models/FailedLoginAttempt')
const { signToken } = require('../utils/jwt')
const { sendWelcomeEmail } = require('../utils/emailService')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    // 1) Kullanıcı var mı?
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' })
    }
    // 2) Sadece local kullanıcıların şifresini kontrol ediyoruz
    if (user.provider !== 'local') {
      return res
        .status(400)
        .json({ message: `Lütfen ${user.provider} ile giriş yapın.` })
    }
    // 3) Şifre karşılaştırması
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      // 1) Başarısız denemeyi kaydet
      await FailedLoginAttempt.create({
        user: user._id,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })
      // 2) Sayaçı artır ve kaydet
      user.failedLoginCount = (user.failedLoginCount || 0) + 1
      await user.save() // password validator pas geçilecek (isModified kontrolü ile)

      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' })
    }
    // 4) loginCount ve lastLoginAt güncelle
    user.loginCount += 1
    user.lastLoginAt = Date.now()
    await user.save()

    // 5) Token oluştur
    const token = signToken(user._id)

    // 6) Yanıt: token + kullanıcı bilgisi (şifresiz)
    const userObj = user.toObject()
    delete userObj.password
    res.json({ token, user: userObj })
  } catch (err) {
    next(err)
  }
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body

    // 1) Duplicate kontrolü
    const exists = await User.findOne({
      $or: [{ username }, { email }],
    })
    if (exists) {
      return res
        .status(400)
        .json({ message: 'Kullanıcı adı veya e-posta zaten kayıtlı.' })
    }

    // 2) Yeni user yarat
    const user = new User({
      username,
      email,
      password,
      provider: 'local',
      role: 'user',
    })
    await user.save()

    // Hoş geldin maili gönder (hata olsa da registration’ı bozma)
    sendWelcomeEmail(email, username).catch(err =>
      console.error('Hoş geldin maili gönderilemedi:', err)
    )

    // 3) Token üret ve dön
    const token = signToken(user._id)
    const userObj = user.toObject()
    delete userObj.password
    res.status(201).json({ token, user: userObj })
  } catch (err) {
    next(err)
  }
}

exports.getFailedAttempts = async (req, res, next) => {
  try {
    const userId = req.user._id
    // Son 50 denemeyi listele, en yeni önce
    const attempts = await FailedLoginAttempt.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('ip userAgent timestamp -_id')

    // Kullanıcıyı da fetch edip sayıyı dönebiliriz
    const user = await User.findById(userId).select('failedLoginCount')

    res.json({
      totalFailedAttempts: user.failedLoginCount,
      attempts,
    })
  } catch (err) {
    next(err)
  }
}
