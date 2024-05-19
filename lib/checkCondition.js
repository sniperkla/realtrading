const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')

const checkConditionOBOS = async (body, res, apiKey, secretKey) => {
  const { SMH, symbol, priceCal, SMCP } = body
  const checkMarket = await Log.findOne({ symbol: symbol })
  const side = checkMarket.side === 'BUY' ? 'SELL' : 'BUY'
  const qty = parseFloat(checkMarket.binanceMarket.origQty)
  const qtyForSMH = parseFloat(checkMarket.binanceMarket.origQty) / 2
  if (SMH === checkMarket?.side || SMCP === checkMarket?.side) {
    console.log('donothing')
  } else {
    if (SMH) {
      const sellAll = await postBinannce(
        symbol,
        side,
        qtyForSMH,
        apiKey,
        secretKey
      )
      if (sellAll.status === 200) {
        const buyit = {
          text: 'SMH',
          msg: `SMH เหรียญ ${symbol} สำเร็จ`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        const buyit = {
          text: 'SMH',
          msg: `Error on SMH เหรียญ ${symbol}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      }
    }
    if (SMCP) {
      const sellAll = await postBinannce(symbol, side, qty, apiKey, secretKey)
      if (sellAll.status === 200) {
        const buyit = {
          text: 'SMCP',
          msg: `SMCP เหรียญ ${symbol} สำเร็จ`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        const buyit = {
          text: 'SMCP',
          msg: `Error on SMCP เหรียญ ${symbol}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      }
    }
  }
}

module.exports = { checkConditionOBOS }

const postBinannce = async (symbol, side, qty, apiKey, secretKey) => {
  const sellAll = await apiBinance.postBinannce(
    symbol,
    side,
    qty,
    'MARKET',
    null,
    true,
    null,
    apiKey,
    secretKey
  )
  return sellAll
}
