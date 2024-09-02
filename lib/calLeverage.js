const axios = require('axios')

const apiBinance = require('./apibinance')
const Martingale = require('../model/martinglale')

const leverageCal = async (
  symbol,
  priceCal,
  stopPriceCal,
  side,
  apiKey,
  secretKey,
  margin
) => {
  let st = Math.abs(((priceCal - stopPriceCal) / stopPriceCal) * 100).toFixed(2)
  let lpStart = 0
  let lpEnd = 0
  let marginStart = 0
  let marginEnd = 0
  let qtyStart = 0
  let qtyEnd = 0
  let lpEnd2 = 0
  let marginEnd2 = 0
  let qtyEnd2 = 0
  let cal2 = 0

  const defaultMargins = await apiBinance.getDefultMagin(apiKey, secretKey)

  const initialMargin = defaultMargins.filter((item) => {
    return item.asset === 'USDT'
  }) // get only USDT
  const defaultMargin = initialMargin[0].availableBalance

  let defaultLeverage = await apiBinance.getLeverageInitial(
    symbol,
    apiKey,
    secretKey
  )
  const askBid = await apiBinance.getMarketPrice(symbol, apiKey, secretKey)
  const markPrice = await apiBinance.getPrice(symbol, apiKey, secretKey)
  const haha = await apiBinance.getExchangeInfo(apiKey, secretKey)

  const x = haha.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const min_Notional = x[0].filters.filter((item) => {
    return item.filterType === 'MIN_NOTIONAL'
  })

  let minimum = min_Notional[0].notional / markPrice

  if (minimum > 0.5) {
    minimum = Math.ceil(minimum)
  } else {
    //minimum = parseFloat(minimum.toFixed(3))
    minimum = Math.ceil(minimum * 1000) / 1000
  }

  let match = 0
  let running = 0

  if (minimum < 0.5) {
    match = parseInt(minimum.toString().match(/\.(\d*)/)[1].length)
    running = parseFloat(1 / Math.pow(10, match))
  } else {
    running = 1
  }
  const previousMargin = await Martingale.findOne({ symbol: symbol })
  let maximumQty = minimum
  const bids = parseFloat(askBid.bids[0][0])
  const asks = parseFloat(askBid.asks[0][0])
  const budget =
    previousMargin?.stackLose > 1 ? previousMargin?.previousMargin : margin
  //defaultMargin * 0.05 || 2.5

  let leverage = budget * defaultLeverage * (st / 100)

  while (leverage > budget) {
    leverage = budget * defaultLeverage * (st / 100)
    if (leverage <= budget) {
      break
    }
    defaultLeverage--
  }
  let direction = 0
  let marketSize = 0
  let price = 0
  let valueAskBid = 0

  if (side === 'BUY') {
    const ask1 = asks * 0.0005
    valueAskBid = asks
    price = parseFloat(asks + ask1)
    direction = 1
  } else if (side === 'SELL') {
    valueAskBid = bids
    price = bids
    direction = -1
  }

  marketSize = (price * maximumQty) / defaultLeverage

  while (marketSize < budget) {
    marketSize = (price * maximumQty) / defaultLeverage

    if (marketSize >= budget) {
      break
    }
    maximumQty = maximumQty + running
  }

  // start here liqulid cal
  const getNotionalLv = await apiBinance.getNotionalLv(
    symbol,
    apiKey,
    secretKey
  )

  const brackets = getNotionalLv[0].brackets
  let Position1BOTH = maximumQty
  const calPositionBracket = price * maximumQty
  let openLongShort = calMargin(
    price,
    maximumQty,
    direction,
    priceCal,
    defaultLeverage
  )

  return {
    maximumQty,
    defaultLeverage,
    st,
    budget,
    minimum,
    openLongShort,
    valueAskBid,
    price,
    bids,
    asks,
    lpStart,
    lpEnd,
    marginStart,
    marginEnd,
    qtyStart,
    qtyEnd,
    marginEnd2,
    lpEnd2,
    qtyEnd2,
    priceCal,
    running
  }
}

const reLeverageCal = async (
  symbol,
  priceCal,
  stopPriceCal,
  side,
  apiKey,
  secretKey,
  oldLeverage,
  margin
) => {
  let st = Math.abs(((priceCal - stopPriceCal) / stopPriceCal) * 100).toFixed(2)
  let lpStart = 0
  let lpEnd = 0
  let marginStart = 0
  let marginEnd = 0
  let qtyStart = 0
  let qtyEnd = 0
  let lpEnd2 = 0
  let marginEnd2 = 0
  let qtyEnd2 = 0

  let defaultLeverage = oldLeverage - 1

  const askBid = await apiBinance.getMarketPrice(symbol, apiKey, secretKey)
  const markPrice = await apiBinance.getPrice(symbol, apiKey, secretKey)
  const haha = await apiBinance.getExchangeInfo(apiKey, secretKey)

  const x = haha.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const min_Notional = x[0].filters.filter((item) => {
    return item.filterType === 'MIN_NOTIONAL'
  })

  let minimum = min_Notional[0].notional / markPrice

  if (minimum > 0.5) {
    minimum = Math.ceil(minimum)
  } else {
    //minimum = parseFloat(minimum.toFixed(3))
    minimum = Math.ceil(minimum * 1000) / 1000
  }

  let match = 0
  let running = 0

  if (minimum < 0.5) {
    match = parseInt(minimum.toString().match(/\.(\d*)/)[1].length)
    running = parseFloat(1 / Math.pow(10, match))
  } else {
    running = 1
  }
  const previousMargin = await Martingale.findOne({ symbol: symbol })
  let maximumQty = minimum
  const bids = parseFloat(askBid.bids[0][0])
  const asks = parseFloat(askBid.asks[0][0])
  const budget =
    previousMargin?.stackLose > 1 ? previousMargin?.previousMargin : margin
  //defaultMargin * 0.05 || 2.5

  let direction = 0
  let marketSize = 0
  let price = 0
  let valueAskBid = 0

  if (side === 'BUY') {
    const ask1 = asks * 0.0005
    valueAskBid = asks
    price = parseFloat(asks + ask1)
    direction = 1
  } else if (side === 'SELL') {
    valueAskBid = bids
    price = bids
    direction = -1
  }

  marketSize = (price * maximumQty) / defaultLeverage

  while (marketSize < budget) {
    marketSize = (price * maximumQty) / defaultLeverage

    if (marketSize >= budget) {
      break
    }
    maximumQty = maximumQty + running
  }

  // start here liqulid cal

  let openLongShort = calMargin(
    price,
    maximumQty,
    direction,
    priceCal,
    defaultLeverage
  )

  return {
    maximumQty,
    defaultLeverage,
    st,
    budget,
    minimum,
    openLongShort,
    valueAskBid,
    price,
    bids,
    asks,
    lpStart,
    lpEnd,
    marginStart,
    marginEnd,
    qtyStart,
    qtyEnd,
    marginEnd2,
    lpEnd2,
    qtyEnd2,
    priceCal,
    running
  }
}

module.exports = {
  leverageCal,
  reLeverageCal
}
const calMargin = (
  price,
  maximumQty,
  direction,
  getMarkPrice,
  defaultLeverage
) => {
  const bidsAsksCost = (price * maximumQty) / defaultLeverage

  const openloss =
    maximumQty * Math.abs(direction * (0 - (getMarkPrice - price)))

  const openLongShort = bidsAsksCost + openloss

  return { openLongShort, openloss, bidsAsksCost }
}
