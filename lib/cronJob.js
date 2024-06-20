const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const Martingale = require('../model/martinglale')
const Lastestpnl = require('../model/unpnl')
const Winrate = require('../model/winrate')
const LogwinRate = require('../model/logwinrate')

require('dotenv').config()

const checkTakeProfit4Step = async (initMargin) => {
  const log = await Log.find()
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY

  const symbol = log.map((item) => {
    return item.symbol
  })

  for (let i = 0; i < symbol.length; i++) {
    const checkMarket = await Log.findOne({
      symbol: symbol[i]
    })

    const unPNL = await apiBinance.getPositionRisk(symbol[i], apiKey, secretKey)

    await Lastestpnl.updateOne(
      { symbol: symbol[i] },
      { $set: { unrealizePnL: unPNL[0].unRealizedProfit } },
      { upsert: true }
    )

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
      const cancleOrderTakeProfit = await apiBinance?.cancleOrder(
        symbol[i],
        checkMarket?.binanceTakeProfit?.orderId,
        apiKey,
        secretKey
      )
      let buyit = {}
      const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
      const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
      const margin = getAccountInfo?.totalMarginBalance || 'error'
      const pnl = await Lastestpnl.findOne({ symbol: symbol[i] })
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `💴 เหรียญ : ${
              symbol[i]
            } StopLoss ไปแล้ว\n                     คงเหลือ :${margin}\n                     กำไรทิพย์ : ${unPNL}\n                     PNL : ${
              pnl?.unrealizePnL || 'error'
            } 💴`
          })
        : checkTakeOrCancleTakeProfit?.status === 'FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `💵 เหรียญ : ${
              symbol[i]
            } TP ไปแล้ว\n                     คงเหลือ :${margin}\n                     กำไรทิพย์ : ${unPNL}\n                     PNL : ${
              pnl?.unrealizePnL || 'error'
            } 💵`
          })
        : (buyit = {
            text: 'filled',
            msg: `💶 เหรียญ : ${
              symbol[i]
            } LP ไปแล้ว\n                     คงเหลือ :${margin}\n                     กำไรทิพย์ : ${unPNL}\n                     PNL : ${
              pnl?.unrealizePnL || 'error'
            } 💶`
          })
      await lineNotifyPost.postLineNotify(buyit)
      await Log.deleteOne({ symbol: symbol[i] })
      if (checkTakeOrCancleStopLoss?.status === 'FILLED') {
        await martingaleUpdate(symbol[i], 'LOSE', initMargin)
        await winrateUpdate(symbol[i], 'LOSE', checkTakeOrCancleStopLoss)
      }
      if (checkTakeOrCancleTakeProfit?.status === 'FILLED') {
        await martingaleUpdate(symbol[i], 'WIN', initMargin)
        await winrateUpdate(symbol[i], 'WIN', checkTakeOrCancleTakeProfit)
      }
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
      msg: `⚠️ Martingale แจ้งเตือน\n                     เหรียญ : ${symbol}\n                     แพ้ติดต่อ ${
        martingale.stackLose + 1
      } งบรวม : ${previousMargin}$ ⚠️
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
      msg: `♻️ เหรียญ ${symbol}\n                     เข้าสู่สภาวะปกติ งบลงทุนกลับคืน: ${margin}$ ♻️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const winrateUpdate = async (symbol, status, data) => {
  if (status === 'WIN') {
    await Winrate.updateOne({
      $inc: { win: 1 }
    })
  } else if (status === 'LOSE') {
    await Winrate.updateOne({
      $inc: { lose: 1 }
    })
  }
  await LogwinRate.findOneAndUpdate(
    { symbol: symbol },
    { marketLog: data, status: status.toLowerCase() },
    { upsert: true }
  )
}
