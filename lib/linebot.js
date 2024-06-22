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
  console.log('youre in send replau')
  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: [
          {
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
                      url: 'https://source.unsplash.com/fashion/150x150',
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
                        uri: 'https://yourstore.com/dresses/floral-maxi'
                      },
                      label: 'Shop Now'
                    }
                  ]
                }
              },
              {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'image',
                      url: 'https://source.unsplash.com/summer/casual/150x150',
                      size: 'full',
                      aspectMode: 'cover'
                    },
                    {
                      type: 'text',
                      text: 'Striped Linen Shirt Dress',
                      wrap: true,
                      size: 'md',
                      weight: 'bold'
                    },
                    {
                      type: 'text',
                      text: 'Effortlessly stylish, perfect for a relaxed summer look.',
                      wrap: true,
                      size: 'sm',
                      color: '#aaaaaa'
                    },
                    {
                      type: 'button',
                      style: 'link',
                      color: '#00bfff',
                      action: {
                        type: 'uri',
                        uri: 'https://yourstore.com/dresses/striped-linen'
                      },
                      label: 'Learn More'
                    }
                  ]
                }
              },
              {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'image',
                      url: 'https://source.unsplash.com/outdoors/dress/150x150',
                      size: 'full',
                      aspectMode: 'cover'
                    },
                    {
                      type: 'text',
                      text: 'Off-the-Shoulder Romper',
                      wrap: true,
                      size: 'md',
                      weight: 'bold'
                    },
                    {
                      type: 'text',
                      text: 'A versatile and playful option for summer adventures.',
                      wrap: true,
                      size: 'sm',
                      color: '#aaaaaa'
                    },
                    {
                      type: 'button',
                      style: 'link',
                      color: '#ff0000',
                      action: {
                        type: 'uri',
                        uri: 'https://yourstore.com/dresses/off-the-shoulder'
                      },
                      label: 'See Details'
                    }
                  ]
                }
              }
            ]
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
