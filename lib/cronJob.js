const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const axios = require('axios')
require('dotenv').config()

const checkTakeProfit4Step = async () => {
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
      checkTakeOrCancleTakeProfit?.status === 'CANCELED' ||
      checkTakeOrCancleTakeProfit?.status === 'EXPIRED' ||
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
    ) {
      for (let j = 2; j <= 4; j++) {
        let takeProfitProperty = `binanceTakeProfit${i}`
        if (checkMarket?.[takeProfitProperty]?.orderId) {
          const cancleTakeProfit = await apiBinance?.cancleOrder(
            symbol[i],
            checkMarket?.[takeProfitProperty]?.orderId,
            apiKey,
            secretKey
          )
        }
      }
      const cancleOrderStopLoss = await apiBinance?.cancleOrder(
        symbol[i],
        checkMarket?.binanceStopLoss?.orderId,
        apiKey,
        secretKey
      )
      await Log.deleteOne({ symbol: symbol[i] })
      const buyit = {
        text: 'filled',
        msg: `เหรียญ : ${symbol[i]} TakeProfit หรือ StopLoss ไปแล้ว`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else {
      console.log('do nothing')
    }
  }
  console.log('CronJob done')
}

module.exports = { checkTakeProfit4Step }
