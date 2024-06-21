const axios = require('axios')
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
    const { BTP, pricecal, version, symbol } = bodys
    const martingale = await Martingale.findOne({ symbol: symbol })
    const stackLose = martingale.stackLose
    const previousMargin = martingale.previousMargin
    const unPNLs = await PNL.findOne({ symbol: symbol })
    const data = await log.findOne({ symbol: symbol })
    const pearsonData = await pearson.findOne({ symbol: symbol })
    if (data) {
      const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
      const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
      const margin = getAccountInfo?.totalMarginBalance || 'error'
      console.log('do nothing pearson')
      await pearson.updateOne({ symbol: symbol }, { $set: bodys })
      const buyit = {
        text: 'pearson',
        msg: `🔶 อัพเดท Pearson\n                     เหรียญ : ${symbol}\n                     BTP : ${BTP} สำเร็จ\n                     เงินคงเหลือ : ${margin} $ \n                     unPNL : ${
          unPNLs?.unrealizePnL || 'error'
        } $\n                     กำไรทิพย์ : ${unPNL} $\n                     Martingale : X${stackLose} | ${previousMargin} $ 🔶`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (!data && pearsonData) {
      await pearson.updateOne({ symbol: symbol }, { $set: bodys })
    } else {
      await pearson.create({ BTP: BTP, version: version, symbol: symbol })
      const buyit = {
        text: 'pearson',
        msg: `🔶 สร้างข้อมูล Pearson\n                     เหรียญ : ${symbol}\n                     BTP : ${BTP} สำเร็จ 🔶`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { pearsonChecker }
