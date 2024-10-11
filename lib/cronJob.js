const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const Martingale = require('../model/martinglale')
const Lastestpnl = require('../model/unpnl')
const Winrate = require('../model/winrate')
const LogwinRate = require('../model/logwinrate')
const monthlyCheck = require('../lib/monthlyChecker')
const InitMarginMonthly = require('../model/initmarginmonthly')
const payload = require('../lib/payload')
const martingaleUpdate = require('../lib/martingaleUpdate')
const initmarginmonthly = require('../model/initmarginmonthly')
const checkEvery1hr = require('../lib/checkEvery1hr')
// const { testTelegrame } = require('./telegramBot')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

require('dotenv').config()
const apiKey = process.env.APIKEY
const secretKey = process.env.SECRETKEY
const checkTakeProfit4Step = async (initMargin) => {
  const log = await Log.find()
  const initmarginmonthly = await InitMarginMonthly.findOne({
    _id: 'initmargin'
  })

  const initmarginport = await InitMarginMonthly.findOne({
    _id: 'initmarginPort'
  })

  if (!initmarginmonthly) {
    await InitMarginMonthly.create({
      _id: 'initmargin',
      value: 0
    })
  }
  if (!initmarginport) {
    await InitMarginMonthly.create({
      _id: 'initmarginPort',
      value: 0
    })
  }

  if (log.length !== 0) {
    const symbol = log.map((item) => {
      return item.symbol
    })

    for (let i = 0; i < symbol.length; i++) {
      const checkMarket = await Log.findOne({
        symbol: symbol[i]
      })
      const unPNL = await apiBinance.getPositionRisk(
        symbol[i],
        apiKey,
        secretKey
      )
      const staticUnrealizePnL = await Lastestpnl.find({ symbol: symbol[i] })
      await Lastestpnl.findOneAndUpdate(
        { symbol: symbol[i] },
        {
          $set: {
            unrealizePnL: unPNL[0]?.unRealizedProfit,
            staticUnrealizePnL:
              unPNL[0]?.unRealizedProfit !== 0
                ? unPNL[0]?.unRealizedProfit
                : staticUnrealizePnL[0]?.unrealizePnL || 0
          }
        },
        { upsert: true }
      )

      const checkTakeOrCancleStopLoss = await apiBinance?.getOrder(
        checkMarket?.binanceStopLoss?.orderId,
        symbol[i],
        apiKey,
        secretKey
      )
      if (
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
        if (checkTakeOrCancleStopLoss?.status === 'FILLED') {
          await martingaleUpdate.update(
            symbol[i],
            'LOSE',
            initMargin,
            apiKey,
            secretKey
          )
          await winrateUpdate(symbol[i], 'LOSE', checkTakeOrCancleStopLoss)
        }

        await Log.deleteOne({ symbol: symbol[i] })

        checkTakeOrCancleStopLoss?.status === 'FILLED' ||
        checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
          ? (buyit = {
              text: 'filled',
              msg: await tpPayload('LOSE', symbol[i])
            })
          : (buyit = {
              text: 'filled',
              msg: await tpPayload('LP', symbol[i])
            })
        // await testTelegrame(buyit.msg)

        await lineNotifyPost.postLineNotify(buyit)
      } else {
        console.log('do nothing')
      }
    }
  } else console.log('No Order Right Now')

  console.log('CronJob Check TakeProfit And Stoploss done')
  return true
}

const check50Percent = async (apiKey, secretKey) => {
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const walletBalance = getAccountInfo?.totalWalletBalance || 'error'
  const marginStartday = await InitMarginMonthly.findOne({
    _id: 'marginstartday'
  })
  if (!marginStartday) {
    await InitMarginMonthly.create({
      _id: 'marginstartday',
      value: walletBalance
    })
  }
  const value = await InitMarginMonthly.findOne({ _id: 'marginstartday' })
  const previousDaily = value.margin
  const daily =
    ((marginStartday?.value - walletBalance) / marginStartday?.value) * 100

  await storeHighest(value.highest, daily, previousDaily)
  return 0 // disable

  const last = await Lastestpnl.find()
  const martingale = await Martingale.find()
  const pnls = last.map((item) => {
    return { symbol: item.symbol, pnl: item.unrealizePnL }
  })
  const margins = martingale.map((item) => {
    return { symbol: item.symbol, margin: item.previousMargin }
  })

  for (i = 0; i < Object.keys(pnls).length; i++) {
    for (j = 0; j < Object.keys(pnls).length; j++) {
      if (pnls[i].symbol === margins[j].symbol) {
        if (pnls[i].pnl > margins[j].margin * 1.8) {
          // const x = await SCMP.scmpSellALL(pnls[i].symbol, apiKey, secretKey)
          const buyit = {
            text: 'alert',
            msg: `😎 แจ้งเตือน\nเหรียญ : ${
              pnls[i].symbol
            }\nได้กำไรมากกว่า 180%: ${parseFloat(pnls[i].pnl).toFixed(2)} 😎
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        } else if (pnls[i].pnl > margins[j].margin * 1.5) {
          const buyit = {
            text: 'alert',
            msg: `😎 แจ้งเตือน\nเหรียญ : ${
              pnls[i].symbol
            }\nได้กำไรมากกว่า 150% : ${parseFloat(pnls[i].pnl).toFixed(2)} 😎
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        } else if (pnls[i].pnl > margins[j].margin * 1) {
          const buyit = {
            text: 'alert',
            msg: `😎 แจ้งเตือน\nเหรียญ : ${
              pnls[i].symbol
            }\nได้กำไรมากกว่า 100% (RR1) : ${parseFloat(pnls[i].pnl).toFixed(
              2
            )} 😎
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        } else if (pnls[i].pnl > margins[j].margin * 0.6) {
          const buyit = {
            text: 'alert',
            msg: `⚠️ แจ้งเตือน\nเหรียญ : ${
              pnls[i].symbol
            }\nได้กำไรมากกว่า 60% : ${parseFloat(pnls[i].pnl).toFixed(2)} ⚠️
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        }
      }
    }
  }
  console.log('CronJob Check Takeprofit 50% done')
  return true
}

const everyStartDay = async (apiKey, secretKey) => {
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const walletBalance = getAccountInfo?.totalWalletBalance || 'error'

  const find = await initmarginmonthly.findOneAndUpdate(
    {
      _id: 'marginstartday'
    },
    { value: walletBalance, margin: 0 }
  )
}
const every1hrPayload = async () => {
  await delay(71000)
  const message = await payload.payloadPnl()
  const payloadPnl = {
    text: 'PAYLOADPNL',
    msg: `🔥 ${message} 🔥`
  }
  // await testTelegrame(payloadPnl.msg)
  await lineNotifyPost.postLineNotify(payloadPnl)
  await checkEvery1hr.checkOrders(apiKey, secretKey)
  await checkEvery1hr.checkSumMatingale()
  await checkEvery1hr.checkSumMatingaleOpened()
}
module.exports = {
  checkTakeProfit4Step,
  check50Percent,
  everyStartDay,
  every1hrPayload
}

// const martingaleUpdate = async (symbol, status, margin) => {
//   const martingale = await Martingale.findOne({ symbol: symbol })

//   if (martingale && status === 'LOSE') {
//     const previousMargin = martingale.previousMargin * 2
//     await Martingale.updateOne(
//       { symbol: symbol },
//       {
//         $inc: {
//           stackLose: 1
//         },
//         $set: {
//           previousMargin: previousMargin
//         }
//       }
//     )
//     await MartingaleLog.create({ symbol: symbol, martingale: previousMargin })
//     const buyit = {
//       text: 'filled',
//       msg: `⚠️ Martingale แจ้งเตือน\n                     เหรียญ : ${symbol}\n                     แพ้ติดต่อ ${
//         martingale.stackLose + 1
//       } งบรวม : ${previousMargin}$ ⚠️
//     `
//     }
//     await lineNotifyPost.postLineNotify(buyit)
//   } else if (martingale && status === 'WIN') {
//     await Martingale.updateOne(
//       { symbol: symbol },
//       { $set: { stackLose: 1 }, previousMargin: margin }
//     )
//     const buyit = {
//       text: 'filled',
//       msg: `♻️ เหรียญ ${symbol}\n                     เข้าสู่สภาวะปกติ งบลงทุนกลับคืน: ${margin}$ ♻️`
//     }
//     await lineNotifyPost.postLineNotify(buyit)
//   }
// }

const winrateUpdate = async (symbol, status, data) => {
  if (status === 'WIN') {
    await Winrate.findOneAndUpdate(
      { _id: 'winrate' },
      {
        $inc: { win: 1 }
      },
      { upsert: true }
    )
  } else if (status === 'LOSE') {
    await Winrate.findOneAndUpdate(
      { _id: 'winrate' },
      {
        $inc: { lose: 1 }
      },
      { upsert: true }
    )
  }
  await LogwinRate.create({
    symbol: symbol,
    marketLog: data,
    status: status.toLowerCase()
  })
}

const tpPayload = async (status, symbol) => {
  const lastestPnl = await Lastestpnl.findOne({ symbol: symbol })
  const message2 = await payload.payloadPnl()
  const message =
    `💵 เหรียญ : ${symbol} ${
      status === 'WIN'
        ? `Takeprofit ไปแล้ว : ${lastestPnl.staticUnrealizePnL}`
        : status === 'LOSE'
        ? `StopLoss ไปแล้ว : ${lastestPnl.staticUnrealizePnL}`
        : `Liquildation ไปแล้ว : ${lastestPnl.staticUnrealizePnL}`
    }` + `${message2} 💵`

  return message
}

const storeHighest = async (highest, daily, previousDaily) => {
  if (daily < previousDaily) {
    await InitMarginMonthly.updateOne(
      { _id: 'marginstartday' },
      { margin: daily || 0 }
    )
  }
  if (daily < highest) {
    await InitMarginMonthly.updateOne(
      { _id: 'marginstartday' },
      { highest: daily || 0 }
    )
  }
}
