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
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://developers-resource.landpress.line.me/fx/img/01_1_cafe.png',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: 'https://line.me/'
      }
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: 'Brown Cafe',
          weight: 'bold',
          size: 'xl'
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'icon',
              size: 'sm',
              url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
            },
            {
              type: 'icon',
              size: 'sm',
              url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
            },
            {
              type: 'icon',
              size: 'sm',
              url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
            },
            {
              type: 'icon',
              size: 'sm',
              url: 'https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png'
            },
            {
              type: 'icon',
              size: 'sm',
              url: 'https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png'
            },
            {
              type: 'text',
              text: '4.0',
              size: 'sm',
              color: '#999999',
              margin: 'md',
              flex: 0
            }
          ]
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'Place',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1
                },
                {
                  type: 'text',
                  text: 'Flex Tower, 7-7-4 Midori-ku, Tokyo',
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: 'Time',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 1
                },
                {
                  type: 'text',
                  text: '10:00 - 23:00',
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'CALL',
            uri: 'https://line.me/'
          }
        },
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'WEBSITE',
            uri: 'https://line.me/'
          }
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [],
          margin: 'sm'
        }
      ],
      flex: 0
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
