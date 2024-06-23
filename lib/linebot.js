require('dotenv').config()
const axios = require('axios')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const apiBinance = require('../lib/apibinance')
const PNL = require('../model/unpnl')
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const token = process.env.LINEBOT
const apiKey = process.env.APIKEY
const secretKey = process.env.SECRETKEY
const SMCP = require('../lib/sellAll')
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

const messageReply = async (body) => {
  const event = body.events[0].type
  const symbol = await log.find()
  if (event === 'postback') {
    const data = body.events[0].postback.data
    console.log("data postback", data)
    await SMCP.scmpSellALL(data, apiKey, secretKey)
  }
  const replyToken = body.events[0].replyToken
  const replyedMsg = body.events[0].message.text
  if (replyedMsg === 'show') {
    await sendReply(symbol, replyToken, replyedMsg)
  } else if (replyedMsg === 'list') {
    await sendReply(symbol, replyToken, replyedMsg)
  }
  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens, replyedMsg) => {
  const symbol = text.map((item) => {
    return item.symbol
  })

  let messages = []
  let flexPayload = []
  let messagesx = []
  let msg = []
  for (i = 0; i < Object.keys(symbol).length; i++) {
    if (replyedMsg === 'list') {
      msg.push(symbol[i])
      flexPayload.push({
        title: symbol[i],
        text: symbol[i],
        actions: [
          {
            type: 'postback',
            label: 'กดจ้า',
            data: `${msg[i]}`
          }
        ]
      })
    } else if (replyedMsg === 'show') {
      messages.push(await checkMsg(symbol[i]))
      messagesx.push({
        type: 'text',
        text: messages[i]
      })
    }
  }

  const flexMessage = {
    type: 'template',
    altText: 'this is a carousel template',
    template: {
      type: 'carousel',
      columns: flexPayload
    }
  }

  try {
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    messagesx.push({
      type: 'text',
      text: `สรุป                     \n                     ✅ กำไรทิพย์ : ${parseFloat(
        unPNL
      ).toFixed(2)} $\n                     ✅ เงินคงเหลือ : ${parseFloat(
        margin
      ).toFixed(2)} $`
    })
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: replyedMsg === 'list' ? [flexMessage] : messagesx //[flexMessage]
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
const checkMsg = async (symbol) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  const stackLose = martingale.stackLose
  const previousMargin = martingale.previousMargin
  const unPNLs = await PNL.findOne({ symbol: symbol })

  let msg = ''
  msg = `🤖 ข้อมูล เหรียญ : ${symbol}\n                     unPNL : ${
    unPNLs?.unrealizePnL || 'error'
  } $\n                     Martingale : X${stackLose} | ${previousMargin} $ 🤖`

  return msg
}

const sellAll = async (symbol) => {
  try {
    console.log('response', response.data)
    return response.data
  } catch (error) {
    return error.response
  }
}
