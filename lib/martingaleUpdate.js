const lineNotifyPost = require('../lib/lineNotifyPost')
const Martingale = require('../model/martinglale')
const MartingaleLog = require('../model/matingalelog')

const update = async (symbol, status, margin) => {
  const martingale = await Martingale.findOne({ symbol: symbol })
  if (martingale && status === 'LOSE') {
    const previousMargin = martingale.previousMargin * 1.5
    await Martingale.updateOne(
      { symbol: symbol },
      {
        $inc: {
          stackLose: 1
        },
        $set: {
          previousMargin: previousMargin
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
