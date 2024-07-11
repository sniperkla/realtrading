require('dotenv').config()
const axios = require('axios')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
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
  let symbol = null
  if (event === 'postback') {
    const data = body.events[0].postback.data
    await SMCP.scmpSellALL(data, apiKey, secretKey)
    await martingaleUpdate.update(data, 'LOSE', margin)
  }
  const replyToken = body.events[0].replyToken
  const replyedMsg = body.events[0].message.text
  if (replyedMsg === 'mar' || replyedMsg === '1') {
    symbol = await Martingale.find()
  } else {
    symbol = await log.find()
  }
  console.log(`hello your press : ${replyedMsg}`)

  console.log('leng', Object.keys(symbol).length)
  await sendReply(symbol, replyToken, replyedMsg)
}

module.exports = { messageReply }

const sendReply = async (text, replyTokens, replyedMsg) => {
  let symbol = {}
  let symbols1 = null

  // console.log('vasdw', accend)
  // if (replyedMsg === 'mar') {
  //   symbols1 = text.map((item) => {
  //     return item?.previousMargin
  //   })
  // }

  // console.log('this is all i want ', symbols1)

  symbol =
    replyedMsg === 'mar'
      ? symbols1
      : text.map((item) => {
          return item.symbol
        })

  // console.log('this is value of mar', symbol)
  let messages = []
  let flexPayload = []
  let messagesx = []
  let msg = []
  let x = ''
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

      x = `${x}\n${messages[i]}`
    } else if (replyedMsg === 'mar') {
      messages.push(await checkMartingale(symbol[i]))
      x = `${x}\n${messages[i]}`
    }
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
    if (replyedMsg === 'show' || replyedMsg === '0' || replyedMsg === 'mar') {
      messagesx.push({
        type: 'text',
        text: `${
          replyedMsg === 'mar'
            ? `✅ Martingale List ✅\nจำนวนเหรียญทั้งหมด : ${
                Object.keys(symbol).length
              } เหรียญ\n\n`
            : `                    ✅ Order List ✅\n                    มีไม้เปิดอยู่ : ${
                Object.keys(symbol).length
              } ไม้\n\n`
        }${x}`
      })
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
  const martingale = (await Martingale.findOne({ symbol: symbol })) || 'error'
  const stackLose = martingale.stackLose || 'error'
  const previousMargin = martingale.previousMargin || 'error'
  const unPNLs = (await PNL.findOne({ symbol: symbol })) || 'error'

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
  msg = `💢 ข้อมูล เหรียญ : ${symbol}\nMartingale ขณะนี้ : แพ้ X${stackLose} | ${
    martingale.previousMargin
  } $\nMartingale สูงสุด : ${martingale.highestMargin || 'error'} 💢\n`
  return msg
}
