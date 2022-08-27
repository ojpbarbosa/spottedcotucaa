import axios from 'axios'
import { createCanvas, loadImage } from 'canvas'

import { readFile, writeFileSync } from 'fs'

const INTERVAL = 1000 * 10 // 10 seconds

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

    spottedsToBeConverted.push({
      timestamp: new Date().getTime(),
      spotted:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    })

    posts.every((p) => {
      const { post } = p

      if (post.id !== lastSpottedId) {
        spottedsToBeConverted.push({
          spotted: post.comment,
          timestamp: post.timestamp
        })

        return true
      } else {
        return false
      }
    })

    spottedsToBeConverted.map(async (p) => {
      let { spotted } = p

      if (spotted.length <= 280) {
        spotted = '"' + spotted + '"'

        const canvas = createCanvas(1080, 1080)
        const context = canvas.getContext('2d')

        const { timestamp } = p

        const createdAt = new Date(timestamp * 1000)

        context.fillStyle = '#ffffff'
        context.drawImage(
          await loadImage('./images/spotted.jpg'),
          0,
          0,
          1080,
          1080
        )

        context.textAlign = 'start'
        context.font = '42px "PT Sans"'

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
          const text = spotted.substring(i * 35, (i + 1) * 35)

          if (text != ' ') {
            context.fillText(text, 100, 360 + i * 40)
          }
        }

        const buffer = canvas.toBuffer()

        writeFileSync(`./image-${new Date().getTime()}.png`, buffer)
      }
    })

    lastSpottedId = posts[0].post.id
  }

  writeFileSync(
    './data/spotteds.json',
    JSON.stringify({ last_spotted_id: lastSpottedId }),
    'utf8'
  )
}, INTERVAL)
