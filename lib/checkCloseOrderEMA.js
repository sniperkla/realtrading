const axios = require('axios')
const apiBinance = require('../lib/apibinance')
const Log = require('../model/log')
const sellAll = require('../lib/sellAll')
const Martingale = require('../model/martinglale')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Lastestpnl = require('../model/unpnl')

require('dotenv').config()
const margin = process.env.MARGIN

const checekOrderEMA = async (body, apiKey, secretKey) => {
  const { symbol } = body
  const data = await Log.findOne({ symbol: symbol })
  const martingale = await Martingale.findOne({ symbol: symbol })
  try {
    if (data?.binanceMarket) {
      // const trades = await apiBinance.getUserTrades(
      //   symbol,
      //   data?.binanceMarket?.orderId,
      //   apiKey,
      //   secretKey
      // )
      // let totalCommission = 0
      // let totalRealizedPnl = 0
      // let result = 0
      // let orderPrice = 0
      // let finalResult = 0
      // trades.forEach((trade) => {
      //   totalCommission += parseFloat(trade?.commission)
      //   totalRealizedPnl += parseFloat(trade?.realizedPnl)
      // })
      // result = totalRealizedPnl + -totalCommission
      const lastestPNL = await Lastestpnl.findOne({ symbol: symbol })
      result = lastestPNL?.unrealizePnL || 0
      await sellAll.scmpSellALL(symbol, apiKey, secretKey)
      const debug = {
        symbol: symbol,
        text: 'debug',
        msg: `DEBUG PNL\n${JSON.stringify(trades)}`
      }
      await lineNotifyPost.postLineNotify(debug)

      if (result >= (martingale?.previousMargin || margin) * 2) {
        await Martingale.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: {
              previousMargin: margin
            }
          },
          { upsert: true }
        )
        finalResult = margin
      } else if (result < 0) {
        orderPrice = (martingale?.previousMargin || margin) + Math.abs(result)

        await Martingale.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: {
              previousMargin: parseFloat(orderPrice?.toFixed(2))
            }
          },
          { upsert: true }
        )
        finalResult = orderPrice
      } else if (result > 0) {
        const checkResult = (martingale?.previousMargin || margin) - result / 2
        if (checkResult >= (martingale?.previousMargin || margin)) {
          await Martingale.findOneAndUpdate(
            { symbol: symbol },
            {
              $set: {
                previousMargin: parseFloat(checkResult?.toFixed(2))
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
        msg: `\n จบไม้ ${symbol} \n 💎 totalPNL : ${
          result > 0 ? `ชนะ +${result}` : `แพ้ ${result}`
        }\n ✅ Margin ก่อนหน้า ${
          martingale?.previousMargin
        } \n ✅ Margin ที่ควรจะเป็นในรอบต่อไป : ${finalResult.toFixed(2)}`
      }
      await lineNotifyPost.postLineNotify(buyit)
      await Log.findOneAndDelete({ symbol: symbol })
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
module.exports = { checekOrderEMA }
