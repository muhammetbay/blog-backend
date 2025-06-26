// utils/emailQueue.js
const Queue = require('bull')
const { sendPostPublishedEmail } = require('./emailService')
const User = require('../models/User')
const Post = require('../models/Post')

// Redis bağlantı ayarları
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
}

const emailQueue = new Queue('post-published', {
  redis: redisConfig,
})

// İş tanımı: her job’da postId var
emailQueue.process(5, async job => {
  const { postId } = job.data
  const post = await Post.findById(postId).lean()
  if (!post || !post.isPublished) return

  // Cursor ile tüm kullanıcıları dolaş
  const cursor = User.find({}).cursor()
  for await (const user of cursor) {
    try {
      await sendPostPublishedEmail(user.email, user.username, post)
    } catch (err) {
      console.error(`Mail gitmedi ${user.email}`, err)
    }
  }
})

// Hata, tamamlanma gibi event’ler
emailQueue.on('completed', job => {
  console.log(`🎉 Job ${job.id} tamamlandı.`)
})
emailQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} başarısız:`, err)
})

module.exports = emailQueue
