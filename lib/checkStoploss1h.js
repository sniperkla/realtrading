const Log = require('../model/log')
const trading = require('../model/trading')
const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')

const checkStoploss1h = async (body, apiKey, secretKey) => {
  const { symbol, side, type, stopPrice } = body

  const checkMarket = await Log.findOne({
    symbol: symbol
  })

  const orderId = checkMarket?.binanceStopLoss?.orderId
  if (side === 'BUY') {
    if (stopPrice >= checkTakeprofitZone?.zone3) {
      await postBinanceAndCheck(symbol, side, stopPrice, apiKey, secretKey)
    } else if (stopPrice >= checkTakeprofitZone?.zone2) {
      await postBinanceAndCheck(symbol, side, stopPrice, apiKey, secretKey)
    }
  } else if (side === 'SELL') {
    if (stopPrice <= checkTakeprofitZone?.zone3) {
      await postBinanceAndCheck(symbol, side, stopPrice, apiKey, secretKey)
    } else if (stopPrice <= checkTakeprofitZone?.zone2) {
      await postBinanceAndCheck(symbol, side, stopPrice, apiKey, secretKey)
    }
  }
}

module.exports = { checkStoploss1h }

const postBinanceAndCheck = async (
  symbol,
  side,
  stopPrice,
  apiKey,
  secretKey
) => {
  const data = await apiBinance.postBinannce(
    symbol,
    side,
    null,
    'STOP_MARKET',
    stopPrice,
    true,
    null,
    apiKey,
    secretKey
  )
  if (data.status === 200) {
    const x = await apiBinance?.cancleOrder(symbol, orderId, apiKey, secretKey)

    await Log.findOneAndUpdate(
      { symbol: symbol },
      { $unset: { binanceStopLoss: '' } }
    )
    await Log.findOneAndUpdate(
      { symbol: symbol },
      { $set: { binanceStopLoss: data.data } }
    )
    const buyit = {
      text: 'updatestoploss',
      msg: `${symbol} Stoploss By Zone ถูกเลื่อน กลับไปยัง STOPLOSS1H : ${stopPrice}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else {
    const buyit = {
      text: 'updatestoploss',
      msg: `${data.data.msg}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}
