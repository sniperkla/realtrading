const axios = require('axios')
const pearson = require('../model/pearsons')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')

const pearsonChecker = async (body, apiKey, secretKey, res) => {
  try {
    const { BTP, pricecal, version, symbol } = body
    const data = await pearson.findOne({ symbol: symbol })

    if (data) {
      console.log('do nothing pearson')
      await pearson.updateOne({ symbol: body.symbol }, { $set: body })
      const buyit = {
        text: 'pearson',
        msg: `อัพเดท Pearson เหรียญ : ${body.symbol} , BTP : ${BTP} สำเร็จ`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (!data) {
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
