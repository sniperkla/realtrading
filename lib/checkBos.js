const Log = require('../model/log')
const Bos = require('../model/bos')
const callLeverage = require('../lib/calLeverage')
const realEnvironment = require('../lib/realEnv')
const binance = require('../lib/apibinance')
const combine = require('../lib/combineUser')
require('dotenv').config()
const margin = process.env.MARGIN
const get = combine.combineUser()

const togleBos = async (symbol) => {
  const identifyBos = await Bos.findOne({
    symbol: symbol
  })
  const identifyPriceCal = await Bos.findOne({
    'priceCal.date': { $gt: identifyBos.bosDate },
    symbol: symbol,
    priceCal: { $nin: [null, '', []] }
  })

  const identifyStopLoss = await Bos.findOne({
    'stopPriceCal.date': { $gt: identifyBos.bosDate },
    symbol: symbol,
    stopPriceCal: { $nin: [null, '', []] }
  })
  const identifyTakeProfit = await Bos.findOne({
    'takeProfit.date': { $gt: identifyBos.bosDate },
    symbol: symbol,
    takeProfit: { $nin: [null, '', []] }
  })
  const body = {
    symbol: identifyBos.symbol.replace(/\.P$/, ''),
    priceCal: identifyBos.priceCal.value,
    takeProfit: identifyBos.takeProfit.value,
    stopPriceCal: identifyBos.stopPriceCal.value,
    side: identifyBos.side,
    type: 'BOS_MARKET_LIMIT'
  }
  if (
    identifyPriceCal &&
    identifyStopLoss &&
    identifyTakeProfit &&
    identifyBos.status === 'NEW'
  ) {
    const LimitBuy = await mainCalLeverage(body, margin)
    await Bos.updateOne({ symbol: symbol }, { status: 'WAIT' })
    return true
  }
  // ReOrder when BOS still
  else if (
    identifyPriceCal &&
    identifyStopLoss &&
    identifyTakeProfit &&
    identifyBos.status === 'WAIT' &&
    identifyBos?.changePriceCal === true
  ) {
    const data = await Log.findOne({ symbol: symbol })
    const orderId = data?.binanceMarket?.orderId
    await binance.cancleOrder(
      symbol,
      orderId,
      get.API_KEY[0],
      get.SECRET_KEY[0]
    )
    await Log.deleteOne({ symbol: symbol })
    const LimitBuy = await mainCalLeverage(body, margin)
    await Bos.updateOne({ symbol: symbol }, { changePriceCal: false })
  }
  {
    console.log('wrong no bos jaa')
    return false
  }
}
module.exports = { togleBos }
const mainCalLeverage = async (body, margin) => {
  const checkMarketFirst = await Log.findOne({
    symbol: body.symbol
  })
  if (checkMarketFirst === null) {
    const calLeverage = await callLeverage.leverageCal(
      body.symbol,
      body.priceCal,
      body.stopPriceCal,
      body.side,
      get.API_KEY[0],
      get.SECRET_KEY[0],
      margin
    )
    checkCondition(
      body,
      calLeverage.maximumQty,
      calLeverage.defaultLeverage,
      calLeverage.budget,
      calLeverage.minimum,
      calLeverage.openLongShort,
      calLeverage.st,
      calLeverage.valueAskBid,
      calLeverage.price,
      calLeverage.bids,
      calLeverage.asks,
      calLeverage.marginStart,
      calLeverage.marginEnd,
      calLeverage.lpStart,
      calLeverage.lpEnd,
      calLeverage.qtyStart,
      calLeverage.qtyEnd,
      calLeverage.marginEnd2,
      calLeverage.lpEnd2,
      calLeverage.qtyEnd2,
      calLeverage.priceCal,
      calLeverage.running
    )
  } else {
    console.log('arleady have market')
  }
}

const checkCondition = async (
  body,
  maximumQty,
  defaultLeverage,
  budget,
  minimum,
  openLongShort,
  st,
  valueAskBid,
  price,
  bids,
  asks,
  marginStart,
  marginEnd,
  lpStart,
  lpEnd,
  qtyStart,
  qtyEnd,
  marginEnd2,
  lpEnd2,
  qtyEnd2,
  priceCal,
  running
) => {
  try {
    const finalBody = {
      ...body,
      quantity: maximumQty,
      leverage: defaultLeverage,
      budget: budget,
      minimum: minimum,
      openLongShort: openLongShort,
      st: st,
      valueAskBid: valueAskBid,
      price: price,
      bids: bids,
      asks: asks,
      marginStart: marginStart,
      marginEnd: marginEnd,
      lpStart: lpStart,
      lpEnd: lpEnd,
      qtyStart: qtyStart,
      qtyEnd: qtyEnd,
      marginEnd2: marginEnd2,
      lpEnd2: lpEnd2,
      qtyEnd2: qtyEnd2,
      priceCal: priceCal,
      running: running
    }
    const checkLog = await Log.findOne({
      symbol: finalBody.symbol
    })

    if (body.type === 'BOS_MARKET_LIMIT') {
      let en = {
        ...finalBody,
        apiKey: get.API_KEY[0],
        secretKey: get.SECRET_KEY[0]
      }
      await realEnvironment.buyingBinance(en)
    }
  } catch (error) {}
}
