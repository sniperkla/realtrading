const lineNotifyPost = require('./lineNotifyPost')
const log = require('../model/log')
const Martingale = require('../model/martinglale')
const apiBinance = require('./apibinance')
const PNL = require('../model/unpnl')

const checkOrders = async (apiKey, secretKey) => {
  try {
    const data = await log.find()
    const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
    const margin = getAccountInfo?.totalMarginBalance || 'error'
    let buyit = {}
    console.log('0')

    for (let i = 0; i < data.length; i++) {
      console.log('1')
      const martingale = await Martingale?.findOne({ symbol: data?.symbol[i] })
      console.log('2')

      const previousMargin = martingale?.previousMargin
      console.log('3')

      const unPNLs = await PNL?.findOne({ symbol: data?.symbol[i] })
      console.log('4')

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
