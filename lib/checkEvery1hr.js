const lineNotifyPost = require('./lineNotifyPost')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const Initmargin = require('../model/initmarginmonthly')
const apiBinance = require('./apibinance')
const { testTelegrame } = require('./telegramBot')
const PNL = require('../model/unpnl')

const checkOrders = async (apiKey, secretKey) => {
  try {
    const data = await log.find()
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    let buyit = {}
    for (let i = 0; i < data.length; i++) {
      const martingale = await Martingale?.findOne({
        symbol: data[i].symbol
      })
      const side = data[i]?.side
      const previousMargin = martingale?.previousMargin
      const unPNLs = await PNL?.findOne({ symbol: data[i]?.symbol })
      buyit = {
        text: 'pearson',
        msg: `🔶 อัพเดท เหรียญ : ${
          data[i].symbol
        }\n                     side : ${side}                     \n                     Margin Balance : ${margin} $ \n                     unPNL : ${
          unPNLs?.unrealizePnL || 'error'
        } $\n                     previousMargin :  | ${previousMargin} $🔶`
      }
      await testTelegrame(buyit?.msg)
      await lineNotifyPost.postLineNotify(buyit)
    }
  } catch (error) {
    return error.response
  }
}

const checkSumMatingale = async () => {
  try {
    const martingale = await Martingale?.find()
    let buyit = {}
    const previousMargins =
      martingale?.map((item) => item?.previousMargin) || 'error'
    const totalPreviousMargin =
      previousMargins.reduce((sum, margin) => sum + margin, 0) || 'error'
    buyit = {
      text: 'pearson',
      msg: `💢💢 Summary Martingale Cost : ${totalPreviousMargin.toFixed(
        2
      )} $ 💢💢`
    }
    await testTelegrame(buyit?.msg)
    await lineNotifyPost.postLineNotify(buyit)
  } catch (error) {
    return error.response
  }
}
const checkSumMatingaleOpened = async () => {
  try {
    const checkInit = await Initmargin.findOne({ _id: 'maxmartingale' })
    const martingale = await Martinglale?.find()
    const logs = await log.find()
    const list = martingale.filter((item) => {
      const result = logs.filter((log) => {
        return log.symbol === item.symbol
      })
      return result
    })
    const previousMargin = list.map((item) => {
      return item?.previousMargin
    })

    const sum =
      previousMargin.reduce((sum, margin) => sum + margin, 0) || 'error'
    if (!checkInit) {
      await Initmargin.create({ _id: 'maxmartingale', highest: sum })
    } else {
      if (checkInit.highest < sum) {
        await Initmargin.findOneAndUpdate(
          { _id: 'maxmartingale' },
          { highest: parseFloat(sum).toFixed(2) },
          { upsert: true }
        )
      }
    }
    const highestMartingale = await Initmargin.findOne({ _id: 'maxmartingale' })
    const buyit = {
      text: 'pearson',
      msg: `💢💢 Summary Martingale Cost Opened : ${sum?.toFixed(
        2
      )} $ 💢💢 \n จำนวนไม้ที่เปิด ${
        logs?.length
      } \n Summary Martingale Cost max : ${highestMartingale?.highest}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  } catch (error) {
    return error.response
  }
}
module.exports = { checkOrders, checkSumMatingale, checkSumMatingaleOpened }
