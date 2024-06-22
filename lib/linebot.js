require('dotenv').config()
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message'
const token = process.env.LINEBOT
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': `${token}`
}

const messageReply = async (body) => {
  const replyToken = body.events[0].replyToken

  if (body.events[0].message === 'อิอิ') {
    await sendReply('fuu', replyToken)
  }
  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens) => {
  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens,
        messages: [
          {
            type: 'text',
            text: text
          }
        ]
      },
      {
        headers: LINE_HEADER
      }
    )

    if (response.status === 200) {
      console.log('Message sent successfully')
    } else {
      console.error('Error sending message:', response.data)
    }
  } catch {}
}
