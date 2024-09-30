const storesl = require('../model/storesl')
const storeStopLoss = async (body) => {
  try {
    const symbol = body?.symbol.replace(/\.P$/, '')

    const checkStoreSL = await storesl.findOne({ symbol: symbol })

    if (checkStoreSL) {
      await storesl.findOneAndUpdate(
        {
          symbol: symbol
        },
        {
          stopPriceCalBuy: body?.stopPriceCalBuy,
          stopPriceCalSell: body?.stopPriceCalSell
        },
        { upsert: true }
      )
    } else {
      await storesl.create({
        symbol: symbol,
        stopPriceCalBuy: body?.stopPriceCalBuy,
        stopPriceCalSell: body?.stopPriceCalSell
      })
    }
  } catch (error) {
    return error.response
  }
}
module.exports = { storeStopLoss }
