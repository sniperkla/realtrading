require('dotenv').config()
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const token = process.env.LINEBOT
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

const messageReply = async (body) => {
  const replyToken = body.events[0].replyToken

  if (body.events[0].message.text === 'อิอิ') {
    console.log('nice dones')
    await sendReply('kuy', replyToken)
  }
  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens) => {
  console.log('youre in send replau')
  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: [
          {
            type: 'text',
            text: text
          }
        ]
      },
      {
        headers
      }
    )
    if (response.status === 200) {
      console.log('Reply message sent successfully')
    } else {
      console.error('Error sending reply message:', response.data)
    }
  } catch (error) {
    console.log('error : ', error)
  }
}
