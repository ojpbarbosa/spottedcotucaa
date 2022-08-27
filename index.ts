import axios from 'axios'

import { readFile, writeFile } from 'fs'

const INTERVAL = 1000 * 10 // 10 seconds

setInterval(async () => {
  let lastPostId = ''

  readFile('./data.json', 'utf8', (error, data) => {
    if (!error) {
      const parsedData = JSON.parse(data)

      lastPostId = parsedData.last_post_id
    }
  })

  const response = await axios.get(
    'https://curiouscat.live/api/v2.1/profile?username=SpottedCotucaa'
  )

  const { data } = response

  const { posts } = data

  if (posts[0].post.id !== lastPostId) {
    const postsToBeConverted = []

    posts.every((post) => {
      if (post.post.id !== lastPostId) {
        postsToBeConverted.push(post.post.comment)

        return true
      } else {
        return false
      }
    })

    lastPostId = posts[0].post.id

    console.log(postsToBeConverted)
  }

  writeFile(
    './data.json',
    JSON.stringify({ last_post_id: lastPostId }),
    'utf8',
    () => {}
  )
}, INTERVAL)
