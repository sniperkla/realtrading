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

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}

const messageReply = async (body) => {
  console.log('should be first')

  const symbol = await log.find()
  const replyToken = body.events[0].replyToken

  if (body.events[0].message.text === 'list') {
    console.log('here0')
    await sendReply(symbol, replyToken)
  }
  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens) => {
  const symbol = text.map((item) => {
    return item.symbol
  })

  let messages = []
  let x = []
  let messagesx = []

  for (i = 0; i < Object.keys(symbol).length; i++) {
    messages.push(await checkMsg(symbol[i]))
    messagesx.push({
      type: 'text',
      text: messages[i]
    })
  }

  await axios.post(
    LINE_MESSAGING_API,
    {
      replyToken: replyTokens, // Can be a single string or array of strings
      messages: messagesx
    },
    {
      headers
    }
  )

  const flexMessage = {
    type: 'template',
    altText: 'this is a carousel template',
    template: {
      type: 'carousel',
      columns: x
    }
  }

  const message = {
    type: 'text',
    text: messages
  }
}

const checkMsg = async (symbol) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  const stackLose = martingale.stackLose
  const previousMargin = martingale.previousMargin
  const unPNLs = await PNL.findOne({ symbol: symbol })
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
  const margin = getAccountInfo?.totalMarginBalance || 'error'

  let msg = ''
  msg = `🔶 อัพเดท Pearson\n                     เหรียญ : ${symbol}\n                                          เงินคงเหลือ : ${margin} $ \n                     unPNL : ${
    unPNLs?.unrealizePnL || 'error'
  } $\n                     Martingale : X${stackLose} | ${previousMargin} $\n                     กำไรทิพย์ : ${unPNL} $ 🔶`

  return msg
}
