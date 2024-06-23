const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const Martingale = require('../model/martinglale')
const Lastestpnl = require('../model/unpnl')
const Winrate = require('../model/winrate')
const LogwinRate = require('../model/logwinrate')
const monthlyCheck = require('../lib/monthlyChecker')
const MartingaleLog = require('../model/matingalelog')
const InitMarginMonthly = require('../model/initmarginmonthly')
const martinglale = require('../model/martinglale')
const SCMP = require('../lib/sellAll')
require('dotenv').config()

const checkTakeProfit4Step = async (initMargin) => {
  const log = await Log.find()
  const initmarginmonthly = await InitMarginMonthly.findOne({
    _id: 'initmargin'
  })
  const monthlyMargin = 400
  if (!initmarginmonthly) {
    await InitMarginMonthly.create({
      _id: 'initmargin',
      monthlyMargin: monthlyMargin
    })
  }

  if (log.length !== 0) {
    const apiKey = process.env.APIKEY
    const secretKey = process.env.SECRETKEY

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

        await Log.deleteOne({ symbol: symbol[i] })
        if (checkTakeOrCancleStopLoss?.status === 'FILLED') {
          await martingaleUpdate(symbol[i], 'LOSE', initMargin)
          await winrateUpdate(symbol[i], 'LOSE', checkTakeOrCancleStopLoss)
        }
        if (checkTakeOrCancleTakeProfit?.status === 'FILLED') {
          await martingaleUpdate(symbol[i], 'WIN', initMargin)
          await winrateUpdate(symbol[i], 'WIN', checkTakeOrCancleTakeProfit)
        }

        checkTakeOrCancleStopLoss?.status === 'FILLED' ||
        checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
          ? (buyit = {
              text: 'filled',
              msg: await tpPayload('LOSE', symbol[i])
            })
          : checkTakeOrCancleTakeProfit?.status === 'FILLED'
          ? (buyit = {
              text: 'filled',
              msg: await tpPayload('WIN', symbol[i])
            })
          : (buyit = {
              text: 'filled',
              msg: await tpPayload('LP', symbol[i])
            })
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        console.log('do nothing')
      }
    }
  } else console.log('No Order Right Now')

  console.log('CronJob Check TakeProfit And Stoploss done')
}

const check50Percent = async () => {
  const last = await Lastestpnl.find()
  const martingale = await Martingale.find()

  const pnl = last.map((item) => {
    return { symbol: item.symbol, pnl: item.unrealizePnL }
  })
  const margin = martingale.map((item) => {
    return { symbol: item.symbol, margin: item.previousMargin }
  })

  for (i = 0; i < Object.keys(pnl).length; i++) {
    for (j = 0; j < Object.keys(pnl).length; j++) {
      if (pnl[i].symbol === margin[j].symbol) {
        if (pnl[i].pnl > margin[j].margin * 0.7) {
          console.log('here pnl[i]')
          console.log('margin[j]', margin[j])
          const x = await SCMP.scmpSellALL(pnl[i].symbol)
          const buyit = {
            text: 'alert',
            msg: `⚠️ แจ้งเตือน\n                     เหรียญ : ${
              pnl[i].symbol
            }\n                    ขายออโต้ที่กำไร 70% : ${parseFloat(
              pnl[i].pnl
            ).toFixed(2)} ⚠️
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        } else if (pnl[i].pnl > margin[j].margin * 0.5) {
          const buyit = {
            text: 'alert',
            msg: `⚠️ แจ้งเตือน\n                     เหรียญ : ${
              pnl[i].symbol
            }\n                   ได้กำไรมากกว่า 50% : ${parseFloat(
              pnl[i].pnl
            ).toFixed(2)} ⚠️
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        } else if (pnl[i].pnl > margin[j].margin * 0.3) {
          const buyit = {
            text: 'alert',
            msg: `⚠️ แจ้งเตือน\n                     เหรียญ : ${
              pnl[i].symbol
            }\n                   ได้กำไรมากกว่า 30% : ${parseFloat(
              pnl[i].pnl
            ).toFixed(2)} ⚠️
        `
          }
          await lineNotifyPost.postLineNotify(buyit)
        }
      }
    }
  }
  console.log('CronJob Check Takeprofit 50% done')
}

module.exports = { checkTakeProfit4Step, check50Percent }

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
    await MartingaleLog.create({ symbol: symbol, martingale: previousMargin })
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
  await LogwinRate.findOneAndUpdate(
    { symbol: symbol },
    { marketLog: data, status: status.toLowerCase() },
    { upsert: true }
  )
}

const tpPayload = async (status, symbol) => {
  console.log('here tpPayload')
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  const initMarginMonthly = await InitMarginMonthly.findOne({
    _id: 'initmargin'
  })
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
  const margin = getAccountInfo?.totalMarginBalance || 'error'
  const pnl = await Lastestpnl.findOne({ symbol: symbol })

  const winrate = await Winrate.find()
  const sumCountWinRate = winrate[0]?.win + winrate[0]?.lose || 0
  console.log('debug winrate', winrate)

  const percentWin = (winrate[0]?.win / sumCountWinRate) * 100 || 0
  const percentLoss = (winrate[0]?.lose / sumCountWinRate) * 100 || 0

  const winrateMonthly = await monthlyCheck.checkMonthlyAction()
  console.log('debug winrateMonthly', winrateMonthly)

  const sumCountWinRateMonthly = winrateMonthly.win + winrateMonthly.lose

  const percentWinMonthly = (winrateMonthly?.win / sumCountWinRateMonthly) * 100
  const percentLoseMonthly =
    (winrateMonthly?.lose / sumCountWinRateMonthly) * 100

  const martingale = await monthlyCheck.checkActionMartingaleOverall()
  const martingaleMonthly = await monthlyCheck.checkMonthlyActionMartingale()

  const maxDrawDown = martingale / initMarginMonthly.monthlyMargin || 0
  const maxDrawDownMountly =
    martingaleMonthly / initMarginMonthly.monthlyMargin || 0

  const message = `💵 เหรียญ : ${symbol} ${
    status === 'WIN'
      ? 'Takeprofit ไปแล้ว'
      : status === 'LOSE'
      ? 'StopLoss ไปแล้ว'
      : 'Liquidation ไปแล้ว'
  } \n                     คงเหลือ : ${margin}\n                     กำไรทิพย์ : ${unPNL}\n                     PNL : ${
    pnl?.unrealizePnL || 'error'
  }\n                     Winrate All : ${
    winrate[0]?.win || 0
  } || ${percentWin}%\n                      LossRate All : ${
    winrate[0]?.lose || 0
  } || ${percentLoss}%\n                     Winrate Monthly : ${
    winrateMonthly?.win || 0
  } || ${percentWinMonthly}%\n                      LossRate Monthy : ${
    winrateMonthly?.lose || 0
  } || ${percentLoseMonthly}%\n                      Max Drawdown All : ${
    maxDrawDown || 0
  } || ${maxDrawDown * 100}%\n                       Max Drawdown Monthly : ${
    maxDrawDownMountly || 0
  } || ${maxDrawDownMountly * 100}% 💵`

  console.log('debug monthly', message)

  return message
}
