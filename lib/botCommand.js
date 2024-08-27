require('dotenv').config()
const lineNotifyPost = require('./lineNotifyPost')
const combine = require('./combineUser')

const Smcp = require('../model/smcp')
const Pearson = require('../model/pearsons')

const Martinglale = require('../model/martinglale')
const Log = require('../model/log')
const apiBinance = require('./apibinance')
const sellAll = require('./sellAll')
const martingaleUpdate = require('./martingaleUpdate')

const margin = process.env.MARGIN
const realEnvironment = require('./realEnv')
const callLeverage = require('./calLeverage')
const get = combine.combineUser()

const buyed = async (body) => {
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

const resetMartingale = async (symbol) => {
  const setMar = await Martinglale.findOneAndUpdate(
    { symbol: symbol },
    { $set: { previousMargin: margin, stackLose: 1 } }
  )
  if (setMar) {
    const buyit = {
      text: 'initsmcp',
      msg: `↪️ รีเซท Martingale to ${margin} สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const resetMartingaleWithValue = async (symbol, value) => {
  const stackLoseMap = [
    { stackLose: 1, margin: 5 },
    { stackLose: 2, margin: 10 },
    { stackLose: 3, margin: 20 },
    { stackLose: 4, margin: 40 },
    { stackLose: 5, margin: 80 },
    { stackLose: 6, margin: 160 },
    { stackLose: 7, margin: 320 },
    { stackLose: 8, margin: 640 },
    { stackLose: 9, margin: 1280 },
    { stackLose: 10, margin: 2560 }
  ]

  const stackLoses = stackLoseMap.filter((item, i) => {
    if (item.margin === parseInt(value)) return stackLoseMap[i]
  })

  const setMar = await Martinglale.findOneAndUpdate(
    { symbol: symbol },
    { $set: { previousMargin: value, stackLose: stackLoses[0].stackLose } }
  )
  if (setMar) {
    const buyit = {
      text: 'initsmcp',
      msg: `↪️ รีเซท Martingale to ${value} สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const adjustTp = async (symbol, tp) => {
  const sideMarket = await Log.findOne({ symbol: symbol })

  const binaceTakeProfitManual = await apiBinance.manualTakeProfit(
    symbol,
    sideMarket?.binanceMarket.side === 'BUY' ? 'SELL' : 'BUY',
    0,
    true,
    tp,
    get.API_KEY[0],
    get.SECRET_KEY[0],
    true
  )

  if (binaceTakeProfitManual.status === 200) {
    const cancle = await apiBinance.cancleOrder(
      symbol,
      sideMarket?.binanceTakeProfit?.orderId,
      get.API_KEY[0],
      get.SECRET_KEY[0]
    )
    await Log.updateOne(
      { symbol: symbol },
      { $set: { binanceTakeProfit: binaceTakeProfitManual.data } }
    )
    const buyit = {
      text: 'initsmcp',
      msg: `↪️ เลื่อน TakeProfit to ${tp} สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }

    await lineNotifyPost.postLineNotify(buyit)
  }
}

const adjustSl = async (symbol, sl, type) => {
  const sideMarket = await Log.findOne({ symbol: symbol })

  const binanceStopLossManual = await apiBinance.manualStoplossZone(
    symbol,
    sideMarket?.binanceMarket.side === 'BUY' ? 'SELL' : 'BUY',
    sl,
    0,
    true,
    get.API_KEY[0],
    get.SECRET_KEY[0]
  )
  if (binanceStopLossManual.status === 200) {
    const cancle = await apiBinance.cancleOrder(
      symbol,
      sideMarket?.binanceStopLoss.orderId,
      get.API_KEY[0],
      get.SECRET_KEY[0]
    )

    if (type) {
      await Log.updateOne(
        { symbol: symbol },
        {
          $set: {
            binanceStopLoss: binanceStopLossManual.data,
            stopLossType: type
          }
        }
      )
    } else if (!type) {
      await Log.updateOne(
        { symbol: symbol },
        {
          $set: { binanceStopLoss: binanceStopLossManual.data },
          $unset: { stopLossType: '' }
        }
      )
    }
    const buyit = {
      text: 'initsmcp',
      msg: `↪️ เลื่อน StopLoss to ${sl} สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }

    await lineNotifyPost.postLineNotify(buyit)
  }
}

const mocklog = async (symbol, stp, smcp) => {
  const checkLog = await Log.findOne({ symbol: symbol })
  let buyit = {}
  if (!checkLog) {
    await Log.create({ symbol: symbol })
    await Smcp.create({ symbol: symbol })
    await Pearson.create({ symbol: symbol, STP: stp })
    buyit = {
      text: 'initsmcp',
      msg: `↪️ Mock สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }
  }
  await lineNotifyPost.postLineNotify(buyit)
}
const delMockLog = async (symbol) => {
  const checkLog = await Log.findOne({ symbol: symbol })
  let buyit = {}
  if (checkLog) {
    await Log.deleteOne({ symbol: symbol })
    buyit = {
      text: 'initsmcp',
      msg: `↪️ ลบ Mock สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }
  } else
    buyit = {
      text: 'initsmcp',
      msg: `↪️ ลบ Mock ไม่สำเร็จ ${symbol} ไม่มีไม้เปิดอยู่\n                     ByOwner ↩️`
    }
  await lineNotifyPost.postLineNotify(buyit)
}
const closeAllMarket = async () => {
  const checkLog = await Log.find()
  for (let i = 0; i < checkLog.length; i++) {
    await sellAll.scmpSellALL(
      checkLog[i].symbol,
      get.API_KEY[0],
      get.SECRET_KEY[0]
    )
    await martingaleUpdate.update(checkLog[i].symbol, 'LOSE', margin)
  }
}
module.exports = {
  buyed,
  resetMartingale,
  resetMartingaleWithValue,
  adjustTp,
  adjustSl,
  mocklog,
  delMockLog,
  closeAllMarket
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
