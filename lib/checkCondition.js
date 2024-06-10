const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')

const checkConditionOBOS = async (body, res, apiKey, secretKey) => {
  const { SMH, symbol, priceCal, SMCP } = body

  const checkMarket = await Log.findOne({ symbol: symbol })

  const side = checkMarket.side === 'BUY' ? 'SELL' : 'BUY'

  const qty = parseFloat(checkMarket.binanceMarket.origQty)

  const qtyForSMH = parseFloat(checkMarket.binanceMarket.origQty) / 2

  const markPrice = await apiBinance.getPrice(symbol, apiKey, secretKey)

  const haha = await apiBinance.getExchangeInfo(apiKey, secretKey)

  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)

  const unPNL = getAccountInfo.totalUnrealizedProfit
  const margin = getAccountInfo.totalMarginBalance
  // const checkBigtrend = checkMarket.lockStopLoss.lockBigTrend

  const x = haha.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const min_Notional = x[0].filters.filter((item) => {
    return item.filterType === 'MIN_NOTIONAL'
  })

  let minimum = min_Notional[0].notional / markPrice

  if (minimum > 0.5) {
    minimum = Math.ceil(minimum)
  } else {
    minimum = Math.ceil(minimum * 1000) / 1000
  }
  if (SMH === checkMarket?.side || SMCP === checkMarket?.side) {
    console.log('do nothing')
  } else {
    if (SMH) {
      const sellHalf = await postBinannce(
        symbol,
        side,
        qtyForSMH >= minimum ? qtyForSMH : 0,
        apiKey,
        secretKey
      )
      if (sellHalf.status === 200) {
        const updateMarket = await Log.updateOne(
          { symbol: symbol },
          {
            $set: {
              binanceMarket: sellHalf.data
            }
          }
        )
        const buyit = {
          text: 'SMH',
          msg: `🚀 SMH (ขายครึ่ง) เหรียญ ${symbol} จำนวน:${qty} เงินคงเหลือ : ${margin}$ , unPNL:${unPNL}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else if (sellHalf.data.msg === 'Quantity less than or equal to zero.') {
        const buyit = {
          text: 'SMH',
          msg: `ยกเลิก SELL HALF > ${symbol} QTY < ขั้นต่ำ รอ ClosePositon`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        const buyit = {
          text: 'SMH',
          msg: `Error on SMH เหรียญ ${symbol} : ${sellHalf.data.msg}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      }
    }
    if (SMCP) {
      // (SMCP && !checkBigtrend) ||
      // (checkBigtrend
      //   ? checkMarket.side === 'BUY'
      //     ? body?.bigTrend === 'BTU'
      //     : body?.bigTrend === 'BTL'
      //   : null)
      const sellAll = await postBinannce(symbol, side, qty, apiKey, secretKey)
      if (sellAll.status === 200) {
        const buyit = {
          text: 'SMCP',
          msg: `🚀 SMCP (ขายหมด) เหรียญ ${symbol} จำนวน:${qty} เงินคงเหลือ:${margin}$ , unPNL:${unPNL}`
        }
        await lineNotifyPost.postLineNotify(buyit)
        await Log.deleteOne({ symbol: symbol })
      } else {
        const buyit = {
          text: 'SMCP',
          msg: `Error on SMCP เหรียญ ${symbol} : ${sellAll.data.msg}`
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
