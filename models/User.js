// models/User.js
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const PASSWORD_REGEX =
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?!(?:.*[^A-Za-z0-9]){2,}).*$/

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // models/User.js içindeki password tanımı
    password: {
      type: String,
      required: function () {
        return this.provider === 'local'
      },
      validate: {
        validator: function (pw) {
          // Eğer password alanı **değişmemişse**, validasyonu pas geç
          if (!this.isModified('password')) return true
          // Değişmişse, girilen plain-text şifreyi regex ile kontrol et
          return PASSWORD_REGEX.test(pw)
        },
        message:
          'Şifre en az 8 karakter, en az bir büyük/küçük harf içermeli ve en fazla 1 özel karaktere izin veriyor.',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super'],
      default: 'user',
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    providerId: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Şifreyi save ve update’te hash’le
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

// findOneAndUpdate ile password değişiyorsa hash’le
UserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate()
  if (update.password) {
    const salt = await bcrypt.genSalt(10)
    update.password = await bcrypt.hash(update.password, salt)
    this.setUpdate(update)
  }
  next()
})

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.model('User', UserSchema)
