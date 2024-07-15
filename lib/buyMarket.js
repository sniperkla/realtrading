require('dotenv').config()
const lineNotifyPost = require('./lineNotifyPost')
const combine = require('./combineUser')

const Smcp = require('../model/smcp')
const Martinglale = require('../model/martinglale')
const margin = process.env.MARGIN
const realEnvironment = require('./realEnv')
const callLeverage = require('./calLeverage')
const get = combine.combineUser()

const buyed = async (body) => {
  console.log('body hello line', body)
  const martingale = await Martinglale.findOne({ symbol: body.symbol })
  const data = await Log.findOne({ symbol: body.symbol })
  if (!martingale) {
    await Martinglale.create({
      symbol: body.symbol,
      stackLose: 1,
      previousMargin: margin
    })
  }
  if (!data) {
    console.log('urhere mi')
    const buyit = {
      symbol: body.symbol,
      text: 'initsmcp',
      msg: `💎 มีการสั่งซื้อ Market ${body.symbol}\n                     ByOwner 💎`
    }
    await lineNotifyPost.postLineNotify(buyit)
    await mainCalLeverage(body, margin)
    await Smcp.deleteOne({ symbol: body.symbol })
  } else {
    console.log('have market already')
  }
}
const mainCalLeverage = async (body, margin) => {
  const checkMarketFirst = await Log.findOne({
    symbol: body.symbol
  })

  console.log('urhere mi 3333')

  if (checkMarketFirst === null) {
    console.log('urhere mi 444')

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
    console.log('urhere mi don e')
  } else {
    console.log('arleady have market')
  }
}

module.exports = { buyed }
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

    if (body.type === 'MARKET') {
      let en = {
        ...finalBody,
        apiKey: get.API_KEY[0],
        secretKey: get.SECRET_KEY[0]
      }
      await realEnvironment.buyingBinance(en)
    }
  } catch (error) {}
}
