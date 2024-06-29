const axios = require('axios')
const SMCPS = require('../model/smcp')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')
const apiBinance = require('../lib/apibinance')
const payload = require('../lib/payload')

const smcpCheck = async (body, apiKey, secretKey, res) => {
  try {
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    let bodys = { ...body, symbol: body.symbol.replace(/\.P$/, '') }
    const { SMCP, pricecal, version, symbol } = bodys
    const data = await SMCPS.findOne({ symbol: symbol })
    const message = await payload.payloadPnl(symbol)
    const payloadPnl = {
      text: 'PAYLOADPNL',
      msg: `⚔ ${message} ⚔`
    }
    if (data) {
      console.log('Normally')
    } else {
      await SMCPS.create(bodys)

      await lineNotifyPost.postLineNotify(buyit)
      await lineNotifyPost.postLineNotify(payloadPnl)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { smcpCheck }
