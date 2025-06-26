// utils/agenda.js
const Agenda = require('agenda')
const mongoose = require('mongoose')
const { sendPostPublishedEmail } = require('./emailService')
const User = require('../models/User')
const Post = require('../models/Post')

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'agendaJobs',
  },
})

// “notify-post-published” işi tanımı
agenda.define('notify-post-published', async job => {
  const { postId } = job.attrs.data
  const post = await Post.findById(postId).lean()
  if (!post || !post.isPublished) return

  // Cursor ile bellek yönetimi
  const cursor = User.find({}).cursor()
  for await (const user of cursor) {
    try {
      await sendPostPublishedEmail(user.email, user.username, post)
    } catch (err) {
      console.error(`Email gönderilemedi (${user.email}):`, err)
    }
  }
})

// Agenda’yı başlat
;(async function () {
  await agenda.start()
  console.log('🕒 Agenda çalışıyor, “notify-post-published” kuyruğu hazır.')
})()

module.exports = agenda
