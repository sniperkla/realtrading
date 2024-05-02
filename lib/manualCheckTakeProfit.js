const Log = require('../model/log')

const checkTakeProfitDB = async (symbol, data) => {
  const checkbinanceTakeProfit2 = await Log.findOne({
    symbol: symbol,
    binanceTakeProfit2: { $ne: null }
  })
  const checkbinanceTakeProfit3 = await Log.findOne({
    symbol: symbol,
    binanceTakeProfit3: { $ne: null }
  })
  const checkbinanceTakeProfit4 = await Log.findOne({
    symbol: symbol,
    binanceTakeProfit4: { $ne: null }
  })

  if (checkbinanceTakeProfit2 === null) {
    const updated = await Log.updateOne(
      { symbol: symbol },
      { $set: { binanceTakeProfit2: data } }
    )
    return { msg: 'upadted binanceTakeProfit2 done' }
  } else if (checkbinanceTakeProfit3 === null) {
    const updated = await Log.updateOne(
      { symbol: symbol },
      { $set: { binanceTakeProfit3: data } }
    )
    return { msg: 'upadted binanceTakeProfit3 done' }
  } else if (checkbinanceTakeProfit4 === null) {
    const updated = await Log.updateOne(
      { symbol: symbol },
      { $set: { binanceTakeProfit4: data } }
    )
    return { msg: 'upadted binanceTakeProfit4 done' }
  }
}

module.exports = { checkTakeProfitDB }
