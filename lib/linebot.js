require('dotenv').config()
const axios = require('axios')
const Martingale = require('../model/martinglale')
const martingaleUpdate = require('../lib/martingaleUpdate')
const lvcheck = require('../lib/levelChecker')

const apiBinance = require('../lib/apibinance')
const PNL = require('../model/unpnl')
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const token = process.env.LINEBOT
const apiKey = process.env.APIKEY
const secretKey = process.env.SECRETKEY

const SMCP = require('../lib/sellAll')
const log = require('../model/log')
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
  const lvchecks = await lvcheck.martingale()
  let symbol = {}
  let symbols1 = {}
  if (replyedMsg === 'mar') {
    symbols1 = text.sort((a, b) => b.previousMargin - a.previousMargin)
  }
  symbol =
    replyedMsg === 'mar'
      ? symbols1.map((item) => {
          return item.symbol
        })
      : text.map((item) => {
          return item.symbol
        })

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
    const openOrder = await log.find()
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
      if (replyedMsg === 'mar') {
        messagesx.push({
          type: 'text',
          text: `สรุป เปิดอยู่ทั้งหมด ${
            openOrder.length
          } ไม้ \n${`ระดับ 1 :${lvchecks.lv1.name} usd เปิดอยู่ ${lvchecks.lv1.count} ไม้ รอเปิด ${lvchecks.lv1.left} รายการ \nระดับ 2 :${lvchecks.lv2.name} usd เปิดอยู่ ${lvchecks.lv2.count} ไม้ รอเปิด ${lvchecks.lv2.left} รายการ\nระดับ 3 :${lvchecks.lv3.name} usd เปิดอยู่ ${lvchecks.lv3.count} ไม้ รอเปิด ${lvchecks.lv3.left} รายการ \nระดับ 4 :${lvchecks.lv4.name} usd เปิดอยู่ ${lvchecks.lv4.count} ไม้ รอเปิด ${lvchecks.lv4.left} รายการ \nระดับ 5 :${lvchecks.lv5.name} usd เปิดอยู่ ${lvchecks.lv5.count} ไม้ รอเปิด ${lvchecks.lv5.left} รายการ \nระดับ 6 :${lvchecks.lv6.name} usd เปิดอยู่ ${lvchecks.lv6.count} ไม้ รอเปิด ${lvchecks.lv6.left} รายการ \nระดับ 7 :${lvchecks.lv7.name} usd เปิดอยู่ ${lvchecks.lv7.count} ไม้ รอเปิด ${lvchecks.lv7.left} รายการ \nระดับ 8 :${lvchecks.lv8.name} usd เปิดอยู่ ${lvchecks.lv8.count} ไม้ รอเปิด ${lvchecks.lv8.left} รายการ \nระดับ 9 :${lvchecks.lv9.name} usd เปิดอยู่ ${lvchecks.lv9.count} ไม้่ รอเปิด ${lvchecks.lv9.left} รายการ \nระดับ 10 :${lvchecks.lv10.name} usd เปิดอยู่ ${lvchecks.lv10.count} ไม้ รอเปิด ${lvchecks.lv10.left} รายการ`}`
        })
      }
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
