import 'dotenv/config'
import axios from 'axios'
import { createTransport } from 'nodemailer'
import { createCanvas, loadImage } from 'canvas'

import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'

const INTERVAL = 1000 * 60 * 5 // 5 minutes

const transporter = createTransport({
  host: process.env.NODEMAILER_TRANSPORTER_HOST,
  port: Number(process.env.NODEMAILER_TRANSPORTER_PORT),
  secure: true,
  auth: {
    user: process.env.NODEMAILER_TRANSPORTER_USER,
    pass: process.env.NODEMAILER_TRANSPORTER_PASSWORD
  }
})

setInterval(async () => {
  const response = await axios.get(
    'https://curiouscat.live/api/v2.1/profile?username=SpottedCotucaa'
  )

  const { data } = response
  const { posts } = data

  let lastConvertedSpottedId = JSON.parse(
    readFileSync('./data/spotteds.json', 'utf8')
  ).last_converted_spotted_id

  if (posts[0].post.id !== lastConvertedSpottedId) {
    const spottedsToBeConverted = []

    posts.every(
      ({
        post: { id, comment: spotted, timestamp }
      }: {
        post: { id: string; comment: string; timestamp: Date }
      }) => {
        if (id !== lastConvertedSpottedId) {
          spottedsToBeConverted.push({
            id,
            spotted,
            timestamp
          })

          return true
        } else {
          return false
        }
      }
    )

    const convertedSpotteds = spottedsToBeConverted.map(
      ({ id, spotted, timestamp }) => {
        spotted = spotted.replace(/(\r\n|\n|\r)/gm, ' ')

        if (spotted.length <= 280) {
          spotted = '"' + spotted + '"'

          const canvas = createCanvas(1080, 1080)
          const context = canvas.getContext('2d')
          context.textAlign = 'start'

          context.fillStyle = '#ffffff'
          loadImage('./images/spotted.jpg').then((image) => {
            context.drawImage(image, 0, 0, 1080, 1080)

            const createdAt = new Date(timestamp * 1000 - 10800000)

            context.fillStyle = '#000'
            context.font = '42px Serif'
            context.fillText(
              createdAt.toLocaleDateString('pt-br', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
              }),
              100,
              300
            )

            let line = ''
            let lineCount = 0

            spotted.split(' ').forEach((word: string) => {
              if (context.measureText(line + ' ' + word).width >= 880) {
                context.fillText(line, 100, 370 + lineCount * 50)
                line = ''
                lineCount++
              }

              line += word + ' '
            })

            context.fillText(line, 100, 370 + lineCount * 50)

            writeFileSync(`./images/${id}.png`, canvas.toBuffer())
          })

          return {
            id: id,
            image: `./images/${id}.png`
          }
        }
      }
    )

    await transporter.sendMail({
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_FROM_ADDRESS
      },
      to: {
        name: process.env.MAIL_TO_NAME,
        address: process.env.MAIL_TO_ADDRESS
      },
      subject: 'Novos spotteds!',
      html: convertedSpotteds
        .map((s) => {
          return `<img src="cid:${s.id}">`
        })
        .join(''),
      attachments: convertedSpotteds.map((s) => {
        return {
          filename: `${s.id}.png`,
          path: s.image,
          cid: s.id.toString()
        }
      })
    })

    readdirSync('./images').forEach((file) => {
      if (file !== 'spotted.jpg') {
        unlinkSync(`./images/${file}`)
      }
    })

    lastConvertedSpottedId = posts[0].post.id
  }

  writeFileSync(
    './data/spotteds.json',
    JSON.stringify({ last_converted_spotted_id: lastConvertedSpottedId }),
    'utf8'
  )
}, INTERVAL)
