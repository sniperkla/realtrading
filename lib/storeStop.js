const StoreSL = require('../model/storesl')

const storeStopLoss = async (body) => {
  try {
    const checkStoreSL = await StoreSL.findOne({ symbol: body?.symbol })
    if (checkStoreSL) {
      await StoreSL.findOneAndUpdate(
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
      await StoreSL.create({
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
