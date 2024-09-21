const axios = require('axios')
const apiBinance = require('../lib/apibinance')
const Log = require('../model/log')
const sellAll = require('../lib/sellAll')
const Martingale = require('../model/martinglale')
const lineNotifyPost = require('../lib/lineNotifyPost')

require('dotenv').config()
const margin = process.env.MARGIN

const checekOrderEMA = async (body) => {
  const { symbol } = body
  const data = await Log.findOne({ symbol: symbol })
  const martingale = await Martingale.findOne({ symbol: symbol })
  try {
    if (data?.binanceMarket) {
      await sellAll.scmpSellALL(symbol, apiKey, secretKey)
      const trades = await apiBinance.getUserTrades(
        symbol,
        data?.binanceMarket?.orderId,
        apiKey,
        secretKey
      )
      let totalCommission = 0
      let totalRealizedPnl = 0
      let result = 0
      let orderPrice = 0
      let finalResult = 0
      trades.forEach((trade) => {
        totalCommission += parseFloat(trade?.commission)
        totalRealizedPnl += parseFloat(trade?.realizedPnl)
      })
      result = totalRealizedPnl + -totalCommission
      await lineNotifyPost.postLineNotify(buyit)
      if (result < 0) {
        orderPrice = martingale?.previousMargin || margin + Math.abs(result)
        await Martingale.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: {
              previousMargin: orderPrice
            }
          },
          { upsert: true }
        )
        finalResult = orderPrice
      } else if (result > 0) {
        const checkResult = martingale?.previousMargin || margin - result / 2
        if (checkResult >= martingale?.previousMargin || margin) {
          await Martingale.findOneAndUpdate(
            { symbol: symbol },
            {
              $set: {
                previousMargin: checkResult
              }
            },
            { upsert: true }
          )
          finalResult = checkResult
        }
      }
      const buyit = {
        symbol: symbol,
        text: 'initsmcp',
        msg: `จบไม้ ${symbol} 💎 totalPNL : ${result}\n Margin ที่ควรจะเป็นในรอบต่อไป : ${finalResult}`
      }
      await Log.findOneAndDelete({ symbol: symbol })
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
module.exports = { checekOrderEMA }
