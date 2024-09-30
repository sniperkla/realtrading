const storesl = require('../model/storesl')
const storeStopLoss = async (body) => {
  try {
    const checkStoreSL = await storesl.findOne({ symbol: body?.symbol })
    if (checkStoreSL) {
      await storesl.findOneAndUpdate(
        {
          symbol: body?.symbol
        },
        {
          stopPriceCalBuy: body?.stopPriceCalBuy,
          stopPriceCalSell: body?.stopPriceCalSell
        },
        { upsert: true }
      )
    } else {
      await storesl.create({
        symbol: body?.symbol,
        stopPriceCalBuy: body?.stopPriceCalBuy,
        stopPriceCalSell: body?.stopPriceCalSell
      })
    }
  } catch (error) {
    return error.response
  }
}
module.exports = { storeStopLoss }
