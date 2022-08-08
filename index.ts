import axios from 'axios'

const INTERVAL = 1000 * 10 // 10 seconds

setInterval(async () => {
  const response = await axios.get(
    'https://curiouscat.live/api/v2.1/profile?username=SpottedCotucaa'
  )

  const { data } = response

  console.log(data.posts)
}, INTERVAL)
