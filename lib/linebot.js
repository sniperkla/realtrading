require('dotenv').config()
const axios = require('axios')

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
  const flexMessage = {
    type: 'flex',
    altText: 'Flex Message',
    contents: {
      type: 'bubble',
      direction: 'ltr',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'มาม่าเสี่ยงทาย',
            size: 'xl',
            align: 'center',
            weight: 'bold'
          }
        ]
      },
      hero: {
        type: 'image',
        url: 'https://onemeal-d909a.firebaseapp.com/images/mama/04.jpg',
        size: 'full',
        aspectRatio: '1.51:1',
        aspectMode: 'fit'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'ต้มยำหมูสับ',
            size: 'xl',
            align: 'center',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'แซ่บแบบเบสิค ต้องถ้วยนี้แหละ',
            align: 'center'
          }
        ]
      }
    }
  }

  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: [flexMessage]
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
