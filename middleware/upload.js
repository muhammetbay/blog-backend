// middleware/upload.js
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// 3.1. Lokal depolama için
const uploadDir = process.env.UPLOAD_DIR || 'uploads/'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

export const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_')
    cb(null, name)
  },
})

// 3.2. Bellek depolama (S3 için)
export const memoryStorage = multer.memoryStorage()

// 3.3. File filter (örneğin sadece resim)
const fileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true)
  else
    cb(new Error('Sadece JPEG, PNG veya WebP dosyaları kabul ediliyor.'), false)
}

export const uploadLocal = multer({
  storage: localStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5MB
})

export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})
