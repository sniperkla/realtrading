const pearson = require('../model/pearsons')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const apiBinance = require('../lib/apibinance')
const PNL = require('../model/unpnl')

const pearsonChecker = async (body, apiKey, secretKey, res) => {
  try {
    let bodys = { ...body, symbol: body.symbol.replace(/\.P$/, '') }
    console.log('here enter pear son 1')

    const { STP, pricecal, version, symbol } = bodys
    const martingale = await Martingale.findOne({ symbol: symbol })
    const stackLose = martingale?.stackLose
    const previousMargin = martingale?.previousMargin
    const unPNLs = await PNL?.findOne({ symbol: symbol })
    const data = await log?.findOne({ symbol: symbol })
    const pearsonData = await pearson?.findOne({ symbol: symbol })
    console.log('here enter pear son 2')
    console.log('here enter pear son data', data)

    if (data) {
      console.log('have data')
      const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
      const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
      const margin = getAccountInfo?.totalMarginBalance || 'error'
      console.log('do nothing pearson')
      await pearson.updateOne({ symbol: symbol }, { $set: bodys })
      const buyit = {
        text: 'pearson',
        msg: `🔶 อัพเดท เหรียญ : ${symbol}\n                     STP : ${STP} สำเร็จ\n                     Margin Balance : ${margin} $ \n                     unPNL : ${
          unPNLs?.unrealizePnL || 'error'
        } $\n                     Martingale : X${stackLose} | ${previousMargin} $🔶`
      }

      await lineNotifyPost.postLineNotify(buyit)
    } else if (!data && pearsonData) {
      console.log('no have data and have perason')

      await pearson.updateOne({ symbol: symbol }, { $set: bodys })
    } else {
      console.log('heelo from perason')
      await pearson.create({ STP: STP, version: version, symbol: symbol })
      const buyit = {
        text: 'pearson',
        msg: `🔶 สร้างข้อมูล Pearson\n                     เหรียญ : ${symbol}\n                     STP : ${STP} สำเร็จ 🔶`
      }

      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { pearsonChecker }
