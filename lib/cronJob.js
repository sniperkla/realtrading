const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')

require('dotenv').config()

const checkTakeProfit4Step = async () => {
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
