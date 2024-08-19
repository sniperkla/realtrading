require('dotenv').config()
const axios = require('axios')
const Martingale = require('../model/martinglale')
const martingaleUpdate = require('../lib/martingaleUpdate')
const lvcheck = require('../lib/levelChecker')
const botCommand = require('../lib/botCommand')
const apiBinance = require('../lib/apibinance')
const PNL = require('../model/unpnl')
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const token = process.env.LINEBOT
const apiKey = process.env.APIKEY
const secretKey = process.env.SECRETKEY

const log = require('../model/log')
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
}

const messageReply = async (body) => {
  const margin = process.env.MARGIN
  const event = body.events[0].type
  let symbol = null
  let setSymbol = null
  let setPriceCal = null
  let setStopLoss = null
  let setSide = null
  let result = {}
  if (event === 'postback') {
    const data = body.events[0].postback.data

    await martingaleUpdate.update(data, 'LOSE', margin)
  }
  const replyToken = body.events[0].replyToken
  const replyedMsg = body.events[0].message.text
  if (replyedMsg === 'mar' || replyedMsg === '1') {
    symbol = await Martingale.find()
    await sendReply(symbol, replyToken, replyedMsg)
  } else if (replyedMsg === 'cmd') {
    let messagesx = []
    const standardComandList = [
      {
        cmd: 'แสดง Martingale ทั้งหมด',
        example: 'mar'
      },
      {
        cmd: 'แสดงไม้ที่เปิดอยู่ทั้งหมด',
        example: 'show'
      },
      {
        cmd: 'ปิดไม้ แยกแบบรวดเร็ว แสดงทีละ 8 ไม้',
        example: 'list1 ถึง n'
      }
    ]
    const commandList = [
      {
        cmd: 'เปิดคำสั่งซื้อ Market',
        example: 'set_market symbol:ABCUSDT.P pricecal:1111 sl:1111 side:buy'
      },
      {
        cmd: 'รีเซท Martingale เริ่มต้น',
        example: 'reset_mar symbol:ABCUSDT.P'
      },
      {
        cmd: 'รีเซท Martingale แบบกำหนดค่า',
        example: 'reset_mar symbol:ABCUSDT.P value:10'
      },
      {
        cmd: 'เลื่อน Takeprofit',
        example: 'set_tp symbol:ABCUSDT.P tp:13.052'
      },
      {
        cmd: 'เลื่อน Stoploss จบ martingale*2 (ปกติ)',
        example: 'set_sl symbol:ABCUSDT.P sl:13.052'
      },
      {
        cmd: 'เลื่อน Stoploss จบใช้ martingaleเดิม (BE)',
        example: 'set_sl symbol:ABCUSDT.P sl:13.052 type:be'
      },
      {
        cmd: 'เลื่อน Stoploss จบรีเซต martingale (RE)',
        example: 'set_sl symbol:ABCUSDT.P sl:13.052 type:re'
      },
      {
        cmd: 'จำลองเปิด Market',
        example: 'set_mock symbol:ABCUSDT.P stp:-1'
      },
      {
        cmd: 'ยกเลิกจำลอง Market',
        example: 'rm_mock symbol:ABCUSDT.P'
      },
      {
        cmd: '☠️ ปิดไม้ทั้งหมด ☠️',
        example: 'close_all_market'
      }
    ]
    const all = commandList.map((item) => {
      return `✴️ ${item.cmd}\n ${item.example}\n\n`
    })
    const allStandardCommandList = standardComandList.map((item) => {
      return `✴️ ${item.cmd}\n > ${item.example}\n\n`
    })
    messagesx.push({
      type: 'text',
      text: `                     ชื่อคำสั่ง (พื้นฐาน)\n\n${allStandardCommandList}`
    })
    messagesx.push({
      type: 'text',
      text: `                     ชื่อคำสั่ง (ชุด)\n\n${all}`
    })
    await aloneReply(messagesx, replyToken)
  } else if (replyedMsg.includes('set_market')) {
    setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    setPriceCal = replyedMsg.match(/pricecal:(\S+)/)[1]
    setStopLoss = replyedMsg.match(/sl:(\S+)/)[1]
    setSide = replyedMsg.match(/side:(\S+)/)[1]
    result = {
      version: 'v3.1',
      type: 'MARKET',
      symbol: setSymbol.toUpperCase().replace(/\.P$/, ''),
      priceCal: parseFloat(setPriceCal),
      stopPriceCal: parseFloat(setStopLoss),
      side: setSide.toUpperCase()
    }
    await botCommand.buyed(result)
  } else if (replyedMsg.includes('reset_mar')) {
    let setValue = 0
    const setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    const symbol = setSymbol.toUpperCase().replace(/\.P$/, '')

    if (replyedMsg.includes('value')) {
      setValue = replyedMsg.match(/value:(\S+)/)[1] || null
      await botCommand.resetMartingaleWithValue(symbol, setValue)
    } else {
      await botCommand.resetMartingale(symbol)
    }
  } else if (replyedMsg.includes('set_tp')) {
    const setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    const setTp = replyedMsg.match(/tp:(\S+)/)[1]
    const symbol = setSymbol.toUpperCase().replace(/\.P$/, '')

    await botCommand.adjustTp(symbol, setTp)
  } else if (replyedMsg.includes('set_sl')) {
    let setType = null
    if (replyedMsg.includes('type')) {
      console.log('this si type jaa')
      setType = replyedMsg.match(/type:(\S+)/)[1]
    }
    const setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    const setSl = replyedMsg.match(/sl:(\S+)/)[1]
    const symbol = setSymbol.toUpperCase().replace(/\.P$/, '')
    if (setType) {
      await botCommand.adjustSl(symbol, setSl, setType)
    } else if (setType === null) await botCommand.adjustSl(symbol, setSl)
  } else if (replyedMsg.includes('set_mock')) {
    const setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    const setStp = replyedMsg.match(/stp:(\S+)/)[1]
    const symbol = setSymbol.toUpperCase()
    await botCommand.mocklog(symbol, setStp)
  } else if (replyedMsg.includes('rm_mock')) {
    const setSymbol = replyedMsg.match(/symbol:(\S+)/)[1]
    const symbol = setSymbol.toUpperCase().replace(/\.P$/, '')
    await botCommand.delMockLog(symbol)
  } else if (replyedMsg.includes('close_all_market')) {
    await botCommand.closeAllMarket()
  } else if (
    replyedMsg === 'show' ||
    replyedMsg === 'list1' ||
    replyedMsg === 'list2' ||
    replyedMsg === 'list3'
  ) {
    symbol = await log.find()
    await sendReply(symbol, replyToken, replyedMsg)
  }
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

  let flexPayload3 = []
  let msg = []
  let msg2 = []
  let msg3 = []
  let messagesx = []

  let x = ''
  for (let i = 0; i < Object.keys(symbol).length; i++) {
    let unPNLs = await PNL.findOne({ symbol: symbol[i] })

    if (
      replyedMsg === 'list' ||
      replyedMsg === 'list1' ||
      replyedMsg === 'list2' ||
      replyedMsg === 'list3'
    ) {
      if (i === 1 ?? replyedMsg === 'list') {
        messagesx.push({
          type: 'text',
          text: `kut`
        })
      }
      if (i <= 8 && replyedMsg === 'list1') {
        msg.push(symbol[i])
        console.log('msg', msg)

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
              data: msg[i]
            }
          ]
        })
      } else if (i > 8 && replyedMsg === 'list2') {
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
              data: `${msg2[i - 9]}`
            }
          ]
        })
      } else if (i > 16 && replyedMsg === 'list3') {
        msg3.push(symbol[i])
        flexPayload3.push({
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
              data: `${msg3[i - 17]}`
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
      columns:
        replyedMsg === 'list1'
          ? flexPayload
          : replyedMsg === 'list2'
          ? flexPayload2
          : replyedMsg === 'list3'
          ? flexPayload3
          : null
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
        messages:
          replyedMsg === 'list1' ||
          replyedMsg === 'list2' ||
          replyedMsg === 'list3'
            ? [flexMessage]
            : messagesx //[flexMessage]
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

const aloneReply = async (messagex, replyTokens) => {
  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        replyToken: replyTokens, // Can be a single string or array of strings
        messages: messagex //[flexMessage]
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
