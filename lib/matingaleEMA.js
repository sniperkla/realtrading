const apiBinance = require('../lib/apibinance')
const Martingale = require('../model/martinglale')
const lineNotifyPost = require('../lib/lineNotifyPost')
const MartingaleLog = require('../model/matingalelog')
const Log = require('../model/log')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
require('dotenv').config()
const margin = process.env.MARGIN
const Winrate = require('../model/winrate')
const logwinrate = require('../model/logwinrate')

const calculateMartingale = async (symbol, data, apiKey, secretKey, type) => {
  if (type !== 'bot') {
    await delay(3500)
  }
  try {
    let result = 0
    const martingale = await Martingale.findOne({ symbol: symbol })
    const trades = await apiBinance.getPnl(
      symbol,
      data?.binanceMarket?.orderId,
      apiKey,
      secretKey
    )
    const valueReal = trades[trades.length - 1]?.time
    let totalRealizedPnl = 0
    const matchingTrades = trades.filter((trade) => trade?.time === valueReal)
    matchingTrades.forEach((trade) => {
      totalRealizedPnl += parseFloat(trade?.income || 0)
    })
    result = totalRealizedPnl || margin
    //test//////////////////////////////////
    const deBUG = {
      symbol: symbol,
      text: 'debug',
      msg: `${symbol}\n OrderId : ${data?.binanceMarket?.orderId} \nค่าที่ถูกต้อง PNL\n${result}`
    }
    await lineNotifyPost.postLineNotify(deBUG)
    // // end test //////////////////////////////////

    let finalResult = 0
    if (result >= martingale?.previousMargin * 2) {
      await winrateUpdate(symbol, 'WIN', data?.binanceMarket)
      await Martingale.findOneAndUpdate(
        { symbol: symbol },
        {
          $set: {
            previousMargin: margin
          }
        },
        { upsert: true }
      )
      finalResult = parseFloat(margin)
    } else if (result > 0) {
      await winrateUpdate(symbol, 'WIN', data?.binanceMarket)
      const checkResult = martingale?.previousMargin - result || 0
      let debug = {}
      if (checkResult > margin) {
        finalResult = checkResult + checkResult * (7 / 100)
        debug = {
          symbol: symbol,
          text: 'debug',
          msg: `${symbol} \n checkResult:${checkResult} \n DEBUG WHEN PROFIT RESULT > defultMargin\n มาจิ้นที่ควรจะเป็น :${finalResult}`
        }
        await Martingale.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: {
              previousMargin: parseFloat(finalResult.toFixed(2))
            }
          },
          { upsert: true }
        )
      } else if (checkResult < margin) {
        finalResult = parseFloat(margin)
        await Martingale.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: {
              previousMargin: parseFloat(finalResult.toFixed(2))
            }
          },
          { upsert: true }
        )
        debug = {
          symbol: symbol,
          text: 'debug',
          msg: `${symbol} \n checkResult:${checkResult} \n DEBUG WHEN PROFIT RESULT < defultMargin\n มาจิ้นที่ควรจะเป็น :${finalResult}`
        }
      }
      await lineNotifyPost.postLineNotify(debug || 'error')
    } else if (result < 0) {
      await winrateUpdate(symbol, 'LOSE', data?.binanceMarket)
      orderPrice = (martingale?.previousMargin || margin) + Math.abs(result)
      finalResult = orderPrice + orderPrice * (7 / 100)
      await Martingale.findOneAndUpdate(
        { symbol: symbol },
        {
          $set: {
            previousMargin: parseFloat(finalResult.toFixed(2))
          }
        },
        { upsert: true }
      )
    }
    await MartingaleLog.create({
      symbol: symbol,
      martingale: parseFloat(finalResult.toFixed(2))
    })
    const findmaxMartingale = await MartingaleLog.find()
    const max =
      Math.max(
        ...findmaxMartingale
          .filter((item) => item?.symbol === symbol)
          .map((item) => item?.martingale)
      ) || martingale?.previousMargin
    await Martingale.findOneAndUpdate(
      { symbol: symbol },
      {
        $set: {
          highestMargin: max
        }
      },
      { upsert: true }
    )
    const buyit = {
      symbol: symbol,
      text: 'initsmcp',
      msg: `\n จบไม้ ${symbol} \n 💎 totalPNL : ${
        result > 0 ? `ชนะ +${result}` : `แพ้ ${result}`
      }\n ✅ Margin ก่อนหน้า ${
        martingale?.previousMargin || margin
      } \n ✅ Margin ที่ควรจะเป็นในรอบต่อไป : ${
        finalResult?.toFixed(2) || 'error'
      }`
    }
    await lineNotifyPost.postLineNotify(buyit)

    const checkMarket = await Log.findOne({ symbol: symbol })
    const cancleOrder = await apiBinance?.cancleOrder(
      symbol,
      checkMarket?.binanceStopLoss?.orderId,
      apiKey,
      secretKey
    )
    if (cancleOrder.status === 200) {
      console.log(`successfully delete orderStopLoss on symbol > ${symbol}`)
      await Log.findOneAndDelete({ symbol: symbol })
    }
  } catch (error) {
    const buyit = {
      text: 'initsmcp',
      msg: `❗❗ เหรียญ ${symbol} error from MartingaleEMA : ${error}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}
module.exports = { calculateMartingale }
const winrateUpdate = async (symbol, status, data) => {
  if (status === 'WIN') {
    await Winrate.findOneAndUpdate(
      { _id: 'winrate' },
      {
        $inc: { win: 1 }
      },
      { upsert: true }
    )
  } else if (status === 'LOSE') {
    await Winrate.findOneAndUpdate(
      { _id: 'winrate' },
      {
        $inc: { lose: 1 }
      },
      { upsert: true }
    )
  }
  await logwinrate.create({
    symbol: symbol,
    marketLog: data,
    status: status.toLowerCase()
  })
}
