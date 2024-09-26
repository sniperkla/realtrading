const lineNotifyPost = require('../lib/lineNotifyPost')
const Martingale = require('../model/martinglale')
const Log = require('../model/log')
const MartingaleLog = require('../model/matingalelog')
const apiBinance = require('../lib/apibinance')

const update = async (symbol, status, margin, apiKey, secretKey) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  if (!martingale.highestMargin) {
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
  }
  if (martingale && status === 'LOSE') {
    const martingale = await Martingale.findOne({ symbol: symbol })
    const data = await Log.findOne({ symbol: symbol })
    let result = 0
    let finalResult = 0
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

    result = totalRealizedPnl

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
      finalResult = parseFloat(margin)
    } else if (result > 0) {
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
        debug = {
          symbol: symbol,
          text: 'debug',
          msg: `${symbol} \n checkResult:${checkResult} \n DEBUG WHEN PROFIT RESULT < defultMargin\n มาจิ้นที่ควรจะเป็น :${finalResult}`
        }
      }
      await lineNotifyPost.postLineNotify(debug || 'error')
    } else if (result < 0) {
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

    const martingaleFindMax = await Martingale.findOne({ symbol: symbol })

    const highest = martingaleFindMax?.highestMargin || 0
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $inc: {
          stackLose: 1
        },
        $set: {
          previousMargin: result,
          highestMargin: highest
        }
      }
    )
    await MartingaleLog.create({
      symbol: symbol,
      martingale: result
    })
    const buyit = {
      text: 'filled',
      msg: `⚠️ โดน STOPLOSS\n                     เหรียญ : ${symbol}\n                     แพ้ติดต่อ ${
        martingale.stackLose + 1
      } งบรวม : ${result}$ ⚠️
      `
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

module.exports = { update }
