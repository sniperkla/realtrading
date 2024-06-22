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
    altText: 'Summer Dress Collection', // Alternative text for accessibility
    contents: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'image',
                url: 'https://storage.googleapis.com/fastwork-static/56e49f77-8951-4b18-8b1e-df1919a7d28a.jpg', // Replace with your image URL
                size: 'full',
                aspectMode: 'cover'
              },
              {
                type: 'text',
                text: 'Floral Maxi Dress',
                wrap: true,
                size: 'md',
                weight: 'bold'
              },
              {
                type: 'text',
                text: 'Light and breezy with a beautiful floral print.',
                wrap: true,
                size: 'sm',
                color: '#aaaaaa'
              },
              {
                type: 'button',
                style: 'link',
                color: '#f77f00',
                action: {
                  type: 'uri',
                  uri: 'https://yourstore.com/dresses/floral-maxi' // Replace with your website URL
                },
                label: 'Shop Now'
              }
            ]
          }
        }
        // Add more bubble objects here for additional items in the carousel
      ]
    }
  }
  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: flexMessage
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
