// utils/emailService.js
const nodemailer = require('nodemailer')
require('dotenv').config()

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Basit HTML template ile "Hoş geldin" maili gönderir.
 * @param {string} to   - Alıcının e-posta adresi
 * @param {string} name - Alıcının ismi (örneğin username)
 */
async function sendWelcomeEmail(to, name) {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: auto; padding: 20px; }
          h1 { color: #333; }
          p  { color: #555; }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 20px;
            background-color: #007BFF;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hoş geldin, ${name}!</h1>
          <p>Blog sitemize kayıt olduğun için teşekkür ederiz. Artık bir hesap sahibi olarak gönderilerini paylaşabilir, diğer yorumları okuyabilir ve topluluğumuza katılabilirsin.</p>
          <p>Başlamak istersen hemen aşağıdaki butona tıkla:</p>
          <a class="button" href="https://yourdomain.com/login">Giriş Yap</a>
          <p>Eğer bir sorunun olursa bize bu e-postaya cevap vererek ulaşabilirsin.</p>
          <p>İyi günler dileriz!<br/>Blog Ekibi</p>
        </div>
      </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Blog Sitemize Hoş Geldiniz!',
    html,
  })
}

async function sendPostPublishedEmail(to, name, post) {
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h1>Yeni Makale Yayınlandı: ${post.title}</h1>
      <p>Merhaba ${name},</p>
      <p>${post.excerpt}</p>
      <a href="https://yourdomain.com/posts/${post.slug}" style="display:inline-block;padding:10px 20px;background:#007BFF;color:#fff;text-decoration:none;border-radius:4px">
        Makaleyi Oku
      </a>
      <p>Keyifli okumalar!</p>
    </div>
  `
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Yeni Makale: ${post.title}`,
    html,
  })
}

module.exports = { sendWelcomeEmail, sendPostPublishedEmail }
