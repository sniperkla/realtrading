const lineNotifyPost = require('../lib/lineNotifyPost')
const Martingale = require('../model/martinglale')
const Log = require('../model/log')
const MartingaleLog = require('../model/matingalelog')
const apiBinance = require('../lib/apibinance')

const update = async (symbol, status, margin, apiKey, secretKey) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  // if (!martingale.highestMargin) {
  //   const findmaxMartingale = await MartingaleLog.find()
  //   const max = Math.max(
  //     ...findmaxMartingale
  //       .filter((item) => item.symbol === symbol)
  //       .map((item) => item.martingale)
  //   )
  //   await Martingale.findOneAndUpdate(
  //     { symbol: symbol },
  //     {
  //       $set: {
  //         highestMargin: max || 0
  //       }
  //     },
  //     { upsert: true }
  //   )
  // }

  if (martingale && status === 'LOSE') {
    console.log('should be here')
    const martingale = await Martingale.findOne({ symbol: symbol })
    const data = await Log.findOne({ symbol: symbol })
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
    result = totalRealizedPnl + totalRealizedPnl * (7 / 100)

    // const martingaleFindMax = await Martingale.findOne({ symbol: symbol })
    // const typeMartingale = await Log.findOne({ symbol: symbol })
    // const previousMargin =
    //   typeMartingale?.stopLossType === 'be'
    //     ? martingale.previousMargin
    //     : typeMartingale?.stopLossType === 're'
    //     ? margin
    //     : martingale.previousMargin * 2
    // const highest = martingaleFindMax?.highestMargin || 0
    // const highest = martingaleFindMax?.highestMargin || 0

    console.log('debug1 ')
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $inc: {
          stackLose: 1
        },
        $set: {
          previousMargin: result
        }
      }
    )
    await MartingaleLog.create({
      symbol: symbol,
      martingale: result
    })
    console.log('debug2')

    const buyit = {
      text: 'filled',
      msg: `⚠️ Martingale แจ้งเตือน\n                     เหรียญ : ${symbol}\n                     แพ้ติดต่อ ${
        martingale.stackLose + 1
      } งบรวม : ${result}$ ⚠️
      `
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else if (martingale && status === 'WIN') {
    await Martingale.updateOne(
      { symbol: symbol },
      { $set: { stackLose: 1, previousMargin: margin } }
    )
    const buyit = {
      text: 'filled',
      msg: `♻️ เหรียญ ${symbol}\n                     เข้าสู่สภาวะปกติ งบลงทุนกลับคืน: ${margin}$ ♻️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

module.exports = { update }
