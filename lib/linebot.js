require('dotenv').config()
const axios = require('axios')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const Trading = require('../model/trading')

const martingaleUpdate = require('../lib/martingaleUpdate')

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
  const margin = process.env.MARGIN
  const event = body.events[0].type
  let symbol = await log.find()
  if (event === 'postback') {
    const data = body.events[0].postback.data
    await SMCP.scmpSellALL(data, apiKey, secretKey)
    await martingaleUpdate.update(data, 'LOSE', margin)
  }
  const replyToken = body.events[0].replyToken
  const replyedMsg = body.events[0].message.text

  if (replyedMsg === 'mar' || replyedMsg === '1') {
    console.log('first step jaa')
    symbol = await Trading.find()
  }

  await sendReply(symbol, replyToken, replyedMsg)

  return true
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens, replyedMsg) => {
  const symbol = text.map((item) => {
    return item.symbol
  })
  console.log('symbol jaa', symbol)

  let messages = []
  let flexPayload = []
  let messagesx = []
  let msg = []
  for (i = 0; i < Object.keys(symbol).length; i++) {
    if (replyedMsg === 'list' || replyedMsg === '9') {
      const unPNLs = await PNL.findOne({ symbol: symbol[i] })
      msg.push(symbol[i])
      flexPayload.push({
        title: symbol[i],
        text: `PNL : ≈ ${
          unPNLs.unrealizePnL > 0
            ? `+${unPNLs.unrealizePnL}🔺`
            : `${unPNLs.unrealizePnL}🔻`
        }`,
        actions: [
          {
            type: 'postback',
            label: '☠️ Take Profit ☠️',
            data: `${msg[i]}`
          }
        ]
      })
    } else if (replyedMsg === 'show' || replyedMsg === '0') {
      messages.push(await checkMsg(symbol[i]))
      messagesx.push({
        type: 'text',
        text: messages[i]
      })
    } else if (replyedMsg === 'mar' || replyedMsg === '1') {
      messages.push(await checkMartingale(symbol[i]))
      messagesx.push({
        type: 'text',
        text: messages[i]
      })
    } else return 0
  }

  const flexMessage = {
    type: 'template',
    altText: 'Warning Risk to use',
    template: {
      type: 'carousel',
      columns: flexPayload
    }
  }

  try {
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    if (replyedMsg === 'show' || replyedMsg === '0') {
      messagesx.push({
        type: 'text',
        text: `สรุป                     \n                     ✅ กำไรทิพย์ : ${parseFloat(
          unPNL
        ).toFixed(2)} $\n                     ✅ เงินคงเหลือ : ${parseFloat(
          margin
        ).toFixed(2)} $`
      })
    }
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

const checkMartingale = async (symbol) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  const stackLose = martingale.stackLose
  let msg = ''
  msg = `🤖 ข้อมูล เหรียญ : ${symbol}\nMartingale : X${stackLose} | ${martingale.previousMargin} $ 🤖`
  return msg
}
