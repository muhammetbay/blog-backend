// controllers/mediaController.js

const Image = require('../models/Image')
const sharp = require('sharp')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

// Initialize S3 client for AWS SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * @desc    Upload image to local filesystem and resize
 * @route   POST /api/media/local
 * @access  Private
 * @middleware uploadLocal.single('image')
 */
exports.uploadImageLocal = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' })
    }

    // 1) Resize to 800px width
    const outPath = path.join(
      req.file.destination,
      'resized-' + req.file.filename
    )
    await sharp(req.file.path).resize({ width: 800 }).toFile(outPath)

    // 2) Remove original if desired
    fs.unlinkSync(req.file.path)

    // 3) Persist metadata to MongoDB
    const image = await Image.create({
      url: `/${outPath}`,
      key: path.basename(outPath),
      size: fs.statSync(outPath).size,
      mimeType: req.file.mimetype,
    })

    res.status(201).json(image)
  } catch (err) {
    next(err)
  }
}

/**
 * @desc    Upload image to AWS S3 and resize
 * @route   POST /api/media/s3
 * @access  Private
 * @middleware uploadMemory.single('image')
 */
exports.uploadImageS3 = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' })
    }

    // 1) Resize buffer to 800px width
    const resizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .toBuffer()

    // 2) Generate unique S3 key
    const key = `images/${uuidv4()}${path.extname(req.file.originalname)}`

    // 3) Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: resizedBuffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000',
    })
    await s3Client.send(command)

    // 4) Construct public URL and save in DB
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
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
