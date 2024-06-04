const axios = require('axios')
const SMCPS = require('../model/smcp')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')

const smcpCheck = async (body, apiKey, secretKey, res) => {
  try {
    const { SMCP, pricecal, version, symbol } = body
    const data = await SMCPS.findOne({ symbol: symbol })

    if (data) {
      console.log('Normally')
    } else {
      await SMCPS.create(body)
      const buyit = {
        text: 'SMCPCHECK',
        msg: `อัพเดท SMCP เหรียญ : ${body.symbol} , SMCP : ${SMCP} สำเร็จ`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { smcpCheck }
