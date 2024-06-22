require('dotenv').config()
const axios = require('axios')
const Log = require('../model/log')
const { title } = require('process')
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const token = process.env.LINEBOT
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

const messageReply = async (body) => {
  const symbol = await Log.find()
  const replyToken = body.events[0].replyToken

  if (body.events[0].message.text === 'อิอิ') {
    await sendReply(symbol, replyToken)
  }
  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens) => {
  const symbol = text.map((item) => {
    return item.symbol
  })

  let x = []

  for (i = 0; i < 4; i++) {
    x.push({
      title: symbol[i],
      actions: [
        {
          type: 'message',
          label: 'Action 1',
          text: 'Action 1'
        },
        {
          type: 'message',
          label: 'Action 2',
          text: 'Action 2'
        }
      ]
    })
  }
  console.log('kuy', x)

  const flexMessage = {
    type: 'template',
    altText: 'this is a carousel template',
    template: {
      type: 'carousel',
      columns: [[x]]
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
