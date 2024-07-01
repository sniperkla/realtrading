const SMCPS = require('../model/smcp')
const lineNotifyPost = require('./lineNotifyPost')
const HTTPStatus = require('http-status')

const smcpCheck = async (body, apiKey, secretKey, res) => {
  try {
    let bodys = { ...body, symbol: body.symbol.replace(/\.P$/, '') }
    const { SMCP, symbol } = bodys
    const data = await SMCPS.findOne({ symbol: symbol })
    if (data) {
      console.log('Normally')
    } else {
      await SMCPS.create(bodys)
      const buyit = {
        text: 'SMCPCHECK',
        msg: `✅ ตั้ง SMCP สำเร็จ\n                     เหรียญ : ${symbol}\n                     SMCP : ${SMCP}\n                     เงินคงเหลือ:${margin}$\n                     กำไรทิพย์:${unPNL}$ ✅ `
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {
    return error.response
  }
}

module.exports = { smcpCheck }
