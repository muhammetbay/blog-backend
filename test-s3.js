require('dotenv').config()
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

;(async () => {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: 'images/test.txt',
        Body: Buffer.from('hello'),
        ContentType: 'text/plain',
      })
    )
    console.log('✅ CLI ile değil, Node.js’den PutObject başarılı!')
  } catch (err) {
    console.error(err)
  }
})()
