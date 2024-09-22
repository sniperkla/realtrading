const lineNotifyPost = require('./lineNotifyPost')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const apiBinance = require('./apibinance')
const PNL = require('../model/unpnl')

const checkOrders = async (apiKey, secretKey) => {
  try {
    const data = await log?.find()
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    let buyit = {}
    for (i = 0; i < data.length; i++) {
      const martingale = await Martingale?.findOne({ symbol: data?.symbol[i] })
      const previousMargin = martingale?.previousMargin
      const unPNLs = await PNL?.findOne({ symbol: data?.symbol[i] })
      buyit = {
        text: 'pearson',
        msg: `🔶 อัพเดท เหรียญ : ${
          data.symbol[i]
        }\n                 Margin Balance : ${margin} $ \n                     unPNL : ${
          unPNLs?.unrealizePnL || 'error'
        } $\n                     previousMargin :  | ${previousMargin} $🔶`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
  } catch (error) {
    return error.response
  }
}

module.exports = { checkOrders }
