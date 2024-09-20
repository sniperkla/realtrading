const axios = require('axios')
const apiBinance = require('./lib/apibinance')
const Log = require('../model/log')

const checekOrderEMA = async (body) => {
  const { symbol } = body
  const data = await Log.findOne({ symbol: symbol })
  const trades = await apiBinance.getUserTrades(
    symbol,
    data?.binanceMarket?.orderId,
    get.API_KEY[0],
    get.SECRET_KEY[0]
  )
  let totalCommission = 0
  let totalRealizedPnl = 0
  trades.forEach((trade) => {
    totalCommission += parseFloat(trade.commission)
    totalRealizedPnl += parseFloat(trade.realizedPnl)
  })
  console.log('result', totalCommission + -totalRealizedPnl)
}
module.exports = { checekOrderEMA }
