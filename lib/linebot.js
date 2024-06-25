require('dotenv').config()
const axios = require('axios')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const martingaleUpdate = require('../lib/martingaleUpdate')
const lineNotifyPost = require('../lib/lineNotifyPost')
const setting = require('../model/setting')
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
  const symbol = await log.find()
  const settings = await setting.findOne({ _id: 'chatrrsetting' })
  if (event === 'postback') {
    const data = body.events[0].postback.data
    await SMCP.scmpSellALL(data, apiKey, secretKey)
    await martingaleUpdate.update(data, 'LOSE', margin)
  }
  if (!settings) {
    await setting.create({ _id: 'chatrrsetting' }, { status: false })
  }

  if (event === 'message' && settings.status === true) {
    console.log('hello mother fucker2')
    console.log('hello mother fucker', body.events[0].message.text)
  }

  const replyToken = body.events[0].replyToken
  const replyedMsg = body.events[0].message.text

  await sendReply(symbol, replyToken, replyedMsg)

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
  let quicklaction = {}
  if (replyedMsg === 'setting rr') {
    console.log('ure here')
    await setting.findOneAndUpdate({ _id: 'chatrrsetting' }, { status: true })
    quicklaction = { type: 'text', text: `continue jaa ` }
  }

  if (replyedMsg === 'auto') {
    const autoTakeprofits = await setting.findOne({ _id: 'takeprofitauto' })

    if (autoTakeprofits === 0) {
      await setting.create({ _id: 'takeprofitauto' }, { status: false })
    }

    if (autoTakeprofits.status === true) {
      await setting.findOneAndUpdate(
        { _id: 'takeprofitauto' },
        { status: false }
      )
      const buyit = {
        text: 'setting',
        msg: `❌ ปิด auto takeProfit สำเร็จ ❌`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (autoTakeprofits.status === false) {
      await setting.findOneAndUpdate(
        { _id: 'takeprofitauto' },
        { status: true }
      )
      const buyit = {
        text: 'setting',
        msg: `✅ เปิด auto takeProfit สำเร็จ ✅`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
  }

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
        messages:
          replyedMsg === 'list'
            ? [flexMessage]
            : replyedMsg === 'show'
            ? messagesx
            : replyedMsg === 'setting rr'
            ? quicklaction
            : null //[flexMessage]
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
