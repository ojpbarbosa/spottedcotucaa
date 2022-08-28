import 'dotenv/config'
import axios from 'axios'
import { createCanvas, loadImage } from 'canvas'
import { createTransport } from 'nodemailer'

import { readdir, readFile, unlink, writeFileSync } from 'fs'

const INTERVAL = 1000 * 60 * 5 // 5 minutes

setInterval(async () => {
  let lastSpottedId = ''

  readFile('./data/spotteds.json', 'utf8', (error, data) => {
    if (!error) {
      const parsedData = JSON.parse(data)

      lastSpottedId = parsedData.last_spotted_id
    }
  })

  const response = await axios.get(
    'https://curiouscat.live/api/v2.1/profile?username=SpottedCotucaa'
  )

  const { data } = response

  const { posts } = data

  if (posts[0].post.id !== lastSpottedId) {
    const spottedsToBeConverted = []

    posts.every((p) => {
      const { post } = p

      if (post.id !== lastSpottedId) {
        spottedsToBeConverted.push({
          id: post.id,
          spotted: post.comment,
          timestamp: post.timestamp
        })

        return true
      } else {
        return false
      }
    })

    const convertedSpotteds = spottedsToBeConverted.map((s) => {
      let { spotted } = s

      if (spotted.length <= 280) {
        spotted = '"' + spotted + '"'

        const canvas = createCanvas(1080, 1080)
        const context = canvas.getContext('2d')
        context.font = '42px serif'
        context.textAlign = 'start'

        context.fillStyle = '#ffffff'
        loadImage('./images/spotted.jpg').then((image) => {
          context.drawImage(image, 0, 0, 1080, 1080)

          const { timestamp } = s

          const createdAt = new Date(timestamp * 1000)

          context.fillStyle = '#000'
          context.fillText(
            createdAt.toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric'
            }),
            100,
            300
          )

          // improve implementation
          for (let i = 0; i < 35 - (spotted.length % 35) + 1; i++) {
            const line = spotted.substring(i * 35, (i + 1) * 35)

            if (line != ' ') {
              context.fillText(line, 100, 360 + i * 40)
            }
          }

          const buffer = canvas.toBuffer()

          writeFileSync(`./images/${s.id}.png`, buffer)
        })

        return {
          id: s.id,
          image: `./images/${s.id}.png`
        }
      }
    })

    const transporter = createTransport({
      host: process.env.NODEMAILER_TRANSPORTER_HOST,
      port: Number(process.env.NODEMAILER_TRANSPORTER_PORT),
      secure: true,
      auth: {
        user: process.env.NODEMAILER_TRANSPORTER_USERNAME,
        pass: process.env.NODEMAILER_TRANSPORTER_PASSWORD
      }
    })

    await transporter.sendMail({
      from: {
        name: process.env.MAIL_NAME,
        address: process.env.MAIL_ADDRESS
      },
      to: {
        name: process.env.MAIL_NAME,
        address: process.env.MAIL_ADDRESS
      },
      subject: 'Novos spotteds!',
      html: convertedSpotteds
        .map((s) => {
          return `<p>${s.id}</p><img src="cid:${s.id}">`
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

    lastSpottedId = posts[0].post.id

    readdir('./images', (error, files) => {
      files.forEach((file) => {
        if (file !== 'spotted.jpg' && file !== `${lastSpottedId}.png`) {
          unlink(`./images/${file}`, (error) => {
            if (error) {
              console.error(error)
            }
          })
        }
      })
    })
  }

  writeFileSync(
    './data/spotteds.json',
    JSON.stringify({ last_spotted_id: lastSpottedId }),
    'utf8'
  )
}, INTERVAL)
