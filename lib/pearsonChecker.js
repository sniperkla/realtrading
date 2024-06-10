const axios = require('axios')
const pearson = require('../model/pearsons')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')
const log = require('../model/log')
const apiBinance = require('../lib/apibinance')

const pearsonChecker = async (body, apiKey, secretKey, res) => {
  try {
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const unPNL = getAccountInfo.totalUnrealizedProfit
    const margin = getAccountInfo.totalMarginBalance
    const { BTP, pricecal, version, symbol } = body
    const data = await log.findOne({ symbol: symbol })
    const pearsonData = await pearson.findOne({ symbol: symbol })

    if (data) {
      console.log('do nothing pearson')
      await pearson.updateOne({ symbol: body.symbol }, { $set: body })
      const buyit = {
        text: 'pearson',
        msg: `💥 อัพเดท Pearson เหรียญ : ${body.symbol} , BTP : ${BTP} สำเร็จ\nเงินคงเหลือ:${margin}$ & กำไรทิพย์:${unPNL}$`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (!data && pearsonData) {
      await pearson.updateOne({ symbol: body.symbol }, { $set: body })
    } else {
      await pearson.create({ BTP: BTP, version: version, symbol: symbol })
      const buyit = {
        text: 'pearson',
        msg: `สร้างข้อมูล Pearson เหรียญ : ${body.symbol} , BTP : ${BTP} สำเร็จ`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { pearsonChecker }
