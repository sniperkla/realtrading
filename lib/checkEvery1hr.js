const lineNotifyPost = require('./lineNotifyPost')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const Initmargin = require('../model/initmarginmonthly')
const apiBinance = require('./apibinance')
// const { testTelegrame } = require('./telegramBot')
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
      // await testTelegrame(buyit?.msg)
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
    // await testTelegrame(buyit?.msg)
    await lineNotifyPost.postLineNotify(buyit)
  } catch (error) {
    const buyit = {
      text: 'pearson',
      msg: `error : ${error.response}`
    }
    await lineNotifyPost.postLineNotify(buyit)
    return error.response
  }
}
const checkSumMatingaleOpened = async () => {
  try {
    const checkInit = await Initmargin.findOne({ _id: 'maxmartingale' })
    const martingale = await Martingale?.find()
    const logs = await log.find()
    const list = martingale.filter((martingaleItem) => {
      const matchingLog = logs.find(
        (logItem) => logItem.symbol === martingaleItem.symbol
      )
      return matchingLog !== undefined
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
      )} $ 💢💢  \n 🪐 🪐 Summary Martingale Cost max : ${
        highestMartingale?.highest
      } 🪐 🪐 \n 🎲🎲 Opened Market ${logs?.length} 🎲🎲`
    }
    await lineNotifyPost.postLineNotify(buyit)
  } catch (error) {
    return error.response
  }
}

const checkSideMartingale = async () => {
  try {
    const martingale = await Martingale?.find()

    const checkSideOpened = await log.find() // Assuming Log.find() returns an array

    let sell = []
    let buy = []
    // No need for `map` if just counting BUY and SELL Sides
    const buyCount = checkSideOpened.map((obj) => {
      if (obj.side === 'BUY') {
        buy.push({ symbol: obj.symbol, side: obj.side })
      }
    })
    const sellCount = checkSideOpened.map((obj) => {
      if (obj.side === 'SELL') {
        sell.push({ symbol: obj.symbol, side: obj.side })
      }
    })

    const totalPreviousMarginBuyed = martingale
      .filter((item) => buy.some((obj) => obj.symbol === item.symbol))
      .map((item) => item.previousMargin || 0)
      .reduce((acc, sum) => acc + sum, 0)
    const totalPreviousMarginSelled = martingale
      .filter((item) => sell.some((obj) => obj.symbol === item.symbol))
      .map((item) => item.previousMargin || 0)
      .reduce((acc, sum) => acc + sum, 0)

    const buyit = {
      text: 'pearson',
      msg: `\n จำนวนเปิดไม้ SELL : ${sell.length} มาติงเกลรวม : ${totalPreviousMarginSelled}  \n จำนวนเปิดไม้ BUY : ${buy.length} มาติงเกลรวม :  ${totalPreviousMarginBuyed} `
    }
    await lineNotifyPost.postLineNotify(buyit)
  } catch (error) {
    return error.response
  }
}
module.exports = {
  checkOrders,
  checkSumMatingale,
  checkSumMatingaleOpened,
  checkSideMartingale
}
