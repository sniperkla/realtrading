const axios = require('axios')
const Log = require('../model/log')
const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')

const checkCloseOrder = async (symbol, apiKey, secretKey) => {
  const checkMarket = await Log.findOne({
    symbol: symbol
  })
  //   if (checkMarket?.binanceTakeProfit) {
  const checkTakeOrCancleTakeProfit = await apiBinance?.getOrder(
    checkMarket?.binanceTakeProfit?.orderId,
    symbol,
    apiKey,
    secretKey
  )
  const checkTakeOrCancleStopLoss = await apiBinance?.getOrder(
    checkMarket?.binanceStopLoss?.orderId,
    symbol,
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
    const cancleOrderStopLoss = await apiBinance?.cancleOrder(
      symbol,
      checkMarket?.binanceStopLoss?.orderId,
      apiKey,
      secretKey
    )
    await Log.deleteOne({ symbol: symbol })
    const buyit = {
      text: 'filled',
      msg: `เหรียญ : ${symbol} TakeProfit หรือ StopLoss ไปแล้ว`
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else {
    console.log('do nothing')
  }
}
module.exports = { checkCloseOrder }
