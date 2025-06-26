// controllers/mediaController.js
const Image = require('../models/Image')
const sharp = require('sharp')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

exports.uploadImageLocal = async (req, res, next) => {
  try {
    // Multer uploadLocal.single('image') ile geldi
    if (!req.file) return res.status(400).json({ message: 'Dosya bulunamadı.' })

    // (Opsiyonel) resize: 800px genişlik
    const outPath = path.join(
      req.file.destination,
      'resized-' + req.file.filename
    )
    await sharp(req.file.path).resize({ width: 800 }).toFile(outPath)

    // Orijinal dosyayı silebilir veya ikisini birden saklayabilirsin
    fs.unlinkSync(req.file.path)

    // DB’ye metadata kaydet
    const image = await Image.create({
      url: `/${outPath}`, // statik dosya servisi kurduysan prefix ekle
      key: path.basename(outPath),
      size: fs.statSync(outPath).size,
      mimeType: req.file.mimetype,
    })

    res.status(201).json(image)
  } catch (err) {
    next(err)
  }
}

exports.uploadImageS3 = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Dosya bulunamadı.' })

    // (Opsiyonel) Sharp ile resize
    const resizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .toBuffer()

    // S3 key
    const key = `images/${uuidv4()}${path.extname(req.file.originalname)}`

    // v3 PutObjectCommand kullanımı
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: resizedBuffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000',
    })

    await s3Client.send(command)

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    // DB’ye kaydet
    const image = await Image.create({
      url,
      key,
      size: resizedBuffer.length,
      mimeType: req.file.mimetype,
    })

    res.status(201).json(image)
  } catch (err) {
    next(err)
  }
}
