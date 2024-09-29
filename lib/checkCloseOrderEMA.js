const Log = require('../model/log')
const sellAll = require('../lib/sellAll')

const matingaleEMA = require('../lib/matingaleEMA')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

require('dotenv').config()
const margin = process.env.MARGIN

const checekOrderEMA = async (body, apiKey, secretKey) => {
  const { symbol } = body
  const data = await Log.findOne({ symbol: symbol })
  try {
    if (data?.binanceMarket) {
      await delay(1000)
      await sellAll.scmpSellALL(symbol, apiKey, secretKey)
      await matingaleEMA.calculateMartingale(symbol, data, apiKey, secretKey)
    }
    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
module.exports = { checekOrderEMA }
