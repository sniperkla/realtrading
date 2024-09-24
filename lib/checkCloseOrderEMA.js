const axios = require('axios')
const apiBinance = require('../lib/apibinance')
const Log = require('../model/log')
const sellAll = require('../lib/sellAll')
const Martingale = require('../model/martinglale')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Lastestpnl = require('../model/unpnl')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
      // const lastestPNL = await Lastestpnl.findOne({ symbol: symbol })
      await sellAll.scmpSellALL(symbol, apiKey, secretKey)
      await delay(2000)
      let result = 0
      const trades = await apiBinance.getPnl(
        symbol,
        data?.binanceMarket?.orderId,
        apiKey,
        secretKey
      )
      const valueReal = trades[trades.length - 1].time
      let totalRealizedPnl = 0
      const matchingTrades = trades.filter((trade) => trade?.time === valueReal)
      matchingTrades.forEach((trade) => {
        totalRealizedPnl += parseFloat(trade?.income || 0)
      })

      result = totalRealizedPnl + totalRealizedPnl * (7 / 100) || margin // 7% added for fee
      //test//////////////////////////////////
      const deBUG = {
        symbol: symbol,
        text: 'debug',
        msg: `${symbol}\n OrderId : ${data?.binanceMarket?.orderId} \nค่าที่ถูกต้อง PNL\n${result}`
      }
      await lineNotifyPost.postLineNotify(deBUG)

      // // end test //////////////////////////////////

      // const debug = {
      //   symbol: symbol,
      //   text: 'debug',
      //   msg: `DEBUG PNL\n${JSON.stringify(trades)}`
      // }
      // await lineNotifyPost.postLineNotify(debug)

      if (result >= martingale?.previousMargin * 2) {
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
      } else if (result > 0) {
        const divideBy2 = result / 2 || 0
        const checkResult = martingale?.previousMargin - divideBy2 || 0
        let debug = {}
        if (checkResult > margin) {
          debug = {
            symbol: symbol,
            text: 'debug',
            msg: `${symbol} \n checkResult:${checkResult} \n DEBUG WHEN PROFIT RESULT > defultMargin\n มาจิ้นที่ควรจะเป็น :${margin}`
          }
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
        } else if (checkResult < margin) {
          debug = {
            symbol: symbol,
            text: 'debug',
            msg: `${symbol} \n checkResult:${checkResult} \n DEBUG WHEN PROFIT RESULT < defultMargin\n มาจิ้นที่ควรจะเป็น :${margin}`
          }
          finalResult = margin
        }
        await lineNotifyPost.postLineNotify(debug || 'error')
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
