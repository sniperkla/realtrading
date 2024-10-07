const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const { testTelegrame } = require('./telegramBot')

const scmpSellALL = async (symbol, apiKey, secretKey) => {
  const checkMarket = await Log.findOne({ symbol: symbol })

  const side = checkMarket?.side === 'BUY' ? 'SELL' : 'BUY'

  const qty = parseFloat(checkMarket?.binanceMarket?.origQty)

  //   const qtyForSMH = parseFloat(checkMarket.binanceMarket.origQty) / 2

  //   const markPrice = await apiBinance.getPrice(symbol, apiKey, secretKey)

  //   const haha = await apiBinance.getExchangeInfo(apiKey, secretKey)

  //   const x = haha.data.symbols.filter((item) => {
  //     return item.symbol === symbol
  //   })
  //   const min_Notional = x[0].filters.filter((item) => {
  //     return item.filterType === 'MIN_NOTIONAL'
  //   })

  //   let minimum = min_Notional[0].notional / markPrice

  //   if (minimum > 0.5) {
  //     minimum = Math.ceil(minimum)
  //   } else {
  //     minimum = Math.ceil(minimum * 1000) / 1000
  //   }

  //   if (SMH) {
  //     const sellHalf = await postBinannce(
  //       symbol,
  //       side,
  //       qtyForSMH >= minimum ? qtyForSMH : 0,
  //       apiKey,
  //       secretKey
  //     )
  //     if (sellHalf.status === 200) {
  //       const updateMarket = await Log.updateOne(
  //         { symbol: symbol },
  //         {
  //           $set: {
  //             binanceMarket: sellHalf.data
  //           }
  //         }
  //       )
  //       const buyit = {
  //         text: 'SMH',
  //         msg: `SMH เหรียญ ${symbol} สำเร็จ`
  //       }
  //     }

  try {
    await postBinannce(symbol, side, qty, apiKey, secretKey)
    const buyit = {
      text: 'SMCP',
      msg: `ขายหมด เหรียญ ${symbol} สำเร็จ `
    }
    await testTelegrame(buyit.msg)
    await lineNotifyPost.postLineNotify(buyit)

    // doing here for buy another and then delete it after that

    return { status: true }
  } catch (error) {
    const buyit = {
      text: 'SMCP',
      msg: `Error on EMA เหรียญ ${error}`
    }
    await testTelegrame(buyit.msg)
    await lineNotifyPost.postLineNotify(buyit)
  }
}

module.exports = { scmpSellALL }

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
