const lineNotifyPost = require('../lib/lineNotifyPost')
const Martingale = require('../model/martinglale')
const MartingaleLog = require('../model/matingalelog')

const update = async (symbol, status, margin) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  if (!martingale.highestMargin) {
    const findmaxMartingale = await MartingaleLog.find()
    const filteredMax = findmaxMartingale
      .filter((item) => item.symbol === symbol)
      .reduce((prev, current) => Math.max(prev.martingale, current.martingale))
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $set: {
          highestMargin: filteredMax
        }
      }
    )
  }

  if (martingale && status === 'LOSE') {
    const previousMargin = martingale.previousMargin * 2
    const highest = martingale.highestMargin
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $inc: {
          stackLose: 1
        },
        $set: {
          previousMargin: previousMargin,
          highestMargin: previousMargin > highest ?? highest
        }
      }
    )
    await MartingaleLog.create({ symbol: symbol, martingale: previousMargin })
    const buyit = {
      text: 'filled',
      msg: `⚠️ Martingale แจ้งเตือน\n                     เหรียญ : ${symbol}\n                     แพ้ติดต่อ ${
        martingale.stackLose + 1
      } งบรวม : ${previousMargin}$ ⚠️
      `
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else if (martingale && status === 'WIN') {
    await Martingale.updateOne(
      { symbol: symbol },
      { $set: { stackLose: 1 }, previousMargin: margin }
    )
    const buyit = {
      text: 'filled',
      msg: `♻️ เหรียญ ${symbol}\n                     เข้าสู่สภาวะปกติ งบลงทุนกลับคืน: ${margin}$ ♻️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

module.exports = { update }
