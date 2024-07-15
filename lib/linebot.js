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
  const lvChecksArray = [
    lvchecks.lv1,
    lvchecks.lv2,
    lvchecks.lv3,
    lvchecks.lv4,
    lvchecks.lv5,
    lvchecks.lv6,
    lvchecks.lv7,
    lvchecks.lv8,
    lvchecks.lv9,
    lvchecks.lv10
  ]
  const totalLeft = lvChecksArray.reduce((acc, curr) => acc + curr.left, 0)
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
  let flexPayload2 = []

  let messagesx = []
  let msg = []
  let msg2 = []

  let x = ''
  for (let i = 0; i < Object.keys(symbol).length; i++) {
    if (replyedMsg === 'list' || replyedMsg === 'list2') {
      if (i <= 8 && replyedMsg === 'list') {
        console.log(`uereher+${i}`, i)
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
      } else if (i > 8 && replyedMsg === 'list2') {
        const unPNLs = await PNL.findOne({ symbol: symbol[i] })
        msg2.push(symbol[i])
        flexPayload2.push({
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
              data: `${msg2[i]}`
            }
          ]
        })
      }
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
      columns: Object.keys(symbol).length <= 8 ? flexPayload : flexPayload2
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
            : `                    ✅ Order List ✅\n                    มีเปิดอยู่ : ${
                Object.keys(symbol).length
              } ไม้\n\n`
        }${x}`
      })
      if (replyedMsg === 'mar') {
        messagesx.push({
          type: 'text',
          text: `สรุป เปิดอยู่ทั้งหมด ${
            openOrder.length
          } ไม้ รอเปิด ${totalLeft}\n${`ระดับ 1 :${lvchecks.lv1.name} usd เปิดอยู่ ${lvchecks.lv1.count} รอเปิด ${lvchecks.lv1.left} \nระดับ 2 :${lvchecks.lv2.name} usd เปิดอยู่ ${lvchecks.lv2.count} รอเปิด ${lvchecks.lv2.left}\nระดับ 3 :${lvchecks.lv3.name} usd เปิดอยู่ ${lvchecks.lv3.count} รอเปิด ${lvchecks.lv3.left} \nระดับ 4 :${lvchecks.lv4.name} usd เปิดอยู่ ${lvchecks.lv4.count} รอเปิด ${lvchecks.lv4.left} \nระดับ 5 :${lvchecks.lv5.name} usd เปิดอยู่ ${lvchecks.lv5.count} รอเปิด ${lvchecks.lv5.left} \nระดับ 6 :${lvchecks.lv6.name} usd เปิดอยู่ ${lvchecks.lv6.count} รอเปิด ${lvchecks.lv6.left} \nระดับ 7 :${lvchecks.lv7.name} usd เปิดอยู่ ${lvchecks.lv7.count} รอเปิด ${lvchecks.lv7.left} \nระดับ 8 :${lvchecks.lv8.name} usd เปิดอยู่ ${lvchecks.lv8.count} รอเปิด ${lvchecks.lv8.left} \nระดับ 9 :${lvchecks.lv9.name} usd เปิดอยู่ ${lvchecks.lv9.count} รอเปิด ${lvchecks.lv9.left} \nระดับ 10 :${lvchecks.lv10.name} usd เปิดอยู่ ${lvchecks.lv10.count} รอเปิด ${lvchecks.lv10.left}`}`
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
