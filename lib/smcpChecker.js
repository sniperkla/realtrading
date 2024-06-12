const axios = require('axios')
const SMCPS = require('../model/smcp')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')
const apiBinance = require('../lib/apibinance')

const smcpCheck = async (body, apiKey, secretKey, res) => {
  try {
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const unPNL = getAccountInfo.totalUnrealizedProfit
    const margin = getAccountInfo.totalMarginBalance
    let bodys = { ...body, symbol: body.symbol.replace(/\.P$/, '') }
    const { SMCP, pricecal, version, symbol } = bodys
    const data = await SMCPS.findOne({ symbol: symbol })
    if (data) {
      console.log('Normally')
    } else {
      await SMCPS.create(bodys)
      const buyit = {
        text: 'SMCPCHECK',
        msg: `💥 ตั้ง SMCP เหรียญ : ${symbol} , SMCP : ${SMCP} สำเร็จ \nเงินคงเหลือ:${margin}$ & กำไรทิพย์:${unPNL}$`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { smcpCheck }
