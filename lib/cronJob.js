const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const Martingale = require('../model/martinglale')

require('dotenv').config()

const checkTakeProfit4Step = async (initMargin) => {
  const log = await Log.find()

  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo.totalUnrealizedProfit
  const margin = getAccountInfo.totalMarginBalance

  const symbol = log.map((item) => {
    return item.symbol
  })

  for (let i = 0; i < symbol.length; i++) {
    const checkMarket = await Log.findOne({
      symbol: symbol[i]
    })

    const checkTakeOrCancleTakeProfit = await apiBinance?.getOrder(
      checkMarket?.binanceTakeProfit?.orderId,
      symbol[i],
      apiKey,
      secretKey
    )

    const checkTakeOrCancleStopLoss = await apiBinance?.getOrder(
      checkMarket?.binanceStopLoss?.orderId,
      symbol[i],
      apiKey,
      secretKey
    )

    // testsesssion
    // await martingaleUpdate(symbol[i], 'WIN', initMargin)
    // await martingaleUpdate(symbol[i], 'LOSE', initMargin)

    if (checkTakeOrCancleStopLoss?.status === 'FILLED') {
      await martingaleUpdate(symbol[i], 'LOSE', initMargin)
    }
    if (checkTakeOrCancleTakeProfit?.status === 'FILLED') {
      await martingaleUpdate(symbol[i], 'WIN', initMargin)
    }
    if (
      checkTakeOrCancleTakeProfit?.status === 'FILLED' ||
      checkTakeOrCancleTakeProfit?.status === 'EXPIRED' ||
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'EXPIRED'
    ) {
      console.log(`processing on :${symbol[i]}`)

      const cancleOrderStopLoss = await apiBinance?.cancleOrder(
        symbol[i],
        checkMarket?.binanceStopLoss?.orderId,
        apiKey,
        secretKey
      )
      let buyit = {}
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `🔻 เหรียญ : ${symbol[i]} StopLoss ไปแล้ว  | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔻`
          })
        : checkTakeOrCancleTakeProfit?.status === 'FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `🔺 เหรียญ : ${symbol[i]} TakeProfit ไปแล้ว | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔺`
          })
        : (buyit = {
            text: 'filled',
            msg: `🔻 เหรียญ : ${symbol[i]} Liquidation ไปแล้ว | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔻`
          })
      await lineNotifyPost.postLineNotify(buyit)
      await Log.deleteOne({ symbol: symbol[i] })
    } else {
      console.log('do nothing')
    }
  }
  console.log('CronJob Check TakeProfit And Stoploss done')
}

module.exports = { checkTakeProfit4Step }

const martingaleUpdate = async (symbol, status, margin) => {
  const martingale = await Martingale.findOne({ symbol: symbol })

  if (martingale && status === 'LOSE') {
    const previousMargin = martingale.previousMargin * 2
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $inc: {
          stackLose: 1
        },
        $set: {
          previousMargin: previousMargin
        }
      }
    )
    const buyit = {
      text: 'filled',
      msg: `⚠️ Martingale แจ้งเตือนเหรียญ : ${symbol} แพ้ติดต่อ ${
        martingale.stackLose + 1
      } งบรวม : ${previousMargin}$
    `
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else if (martingale && status === 'WIN') {
    await Martingale.updateOne(
      { symbol: symbol },
      { $set: { stackLose: 1 }, previousMargin: margin }
    )
    const buyit = {
      text: 'filled',
      msg: `♻️ เหรียญ ${symbol} เข้าสู่สภาวะปกติ งบลงทุนกลับคืน: ${margin}$ `
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}
