const Log = require('../model/log')
const updateMarketCounter = require('../lib/checkMarketCounter')
const takeprofit4Step = require('../lib/takeprofit4Step')
const apiBinance = require('./apibinance')
const lineNotifyPost = require('./lineNotifyPost')
const buyingBinance = async (body) => {
  const {
    symbol,
    side,
    type,
    takeProfit,
    quantity,
    stopPriceCal,
    leverage,
    budget,
    minimum,
    openLongShort,
    st,
    valueAskBid,
    price,
    bids,
    asks,
    apiKey,
    secretKey,
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
  } = body
  try {
    const status = true
    await apiBinance.changeMarginType(symbol, apiKey, secretKey)
    await apiBinance.changeLeverage(symbol, leverage, apiKey, secretKey)
    await updateMarketCounter.deleteCounter()

    const binanceMarket = await apiBinance.postBinannce(
      symbol,
      side,
      quantity,
      type,
      stopPriceCal,
      status,

      null,
      apiKey,
      secretKey
    )

    if (binanceMarket.status === 400) {
      const buyit = {
        symbol: symbol,
        text: 'error',
        type: type,
        msg: binanceMarket.data.msg
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (binanceMarket.status === 200) {
      const log = await Log.findOne({ symbol: symbol })
      if (!log) {
        await createLog(symbol, side, takeProfit, binanceMarket?.data)
      }
      const defaultMargins = await apiBinance.getDefultMagin(apiKey, secretKey)
      const initialMargin = defaultMargins.filter((item) => {
        return item.asset === 'USDT'
      }) // get only USDT
      const defaultMargin = initialMargin[0].balance
      const buyit = {
        text: 'buy',
        text2: 'สรุปคำส้งซื้อ',
        symbol: symbol,
        quantity: quantity,
        leverage: leverage,
        budget: budget,
        minimum: minimum,
        openLongShort: openLongShort.openLongShort,
        st: st,
        defaultMargin: defaultMargin,
        stopPriceCal: stopPriceCal,
        side: side,
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
        qtyEnd2: qtyEnd2
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    const binanceStopLoss = await apiBinance.postBinannce(
      symbol,
      side === 'BUY' ? 'SELL' : 'BUY',
      quantity,
      'STOP_MARKET',
      stopPriceCal,
      true,
      null,
      apiKey,
      secretKey
    )
    if (binanceStopLoss.status === 200) {
      const buyit = {
        text: 'stoplossfirst',
        symbol: symbol,
        type: 'STOP_MARKET',
        msg: `🔴 ${symbol} ตั้ง StopLoss สำเร็จ : ${stopPriceCal}  🔴`
      }
      await updateLogStopLoss(symbol, binanceStopLoss.data)
      await lineNotifyPost.postLineNotify(buyit)
    } else if (binanceStopLoss.status === 400) {
      const buyit = {
        text: 'error',
        symbol: symbol,
        type: 'STOP_MARKET',
        msg: binanceStopLoss.data.msg
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
  } catch (error) {
    const buyit = {
      symbol: symbol,
      text: 'errorTryCacth',
      type: type,
      msg: `ปัญหาคำสั่งซื้อ เหรียญ ${symbol} : ${error.response.data.msg}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

module.exports = { buyingBinance }

const createLog = async (symbol, side, takeProfit, datas) => {
  let data = {
    symbol: symbol,
    side: side,
    status: 'BUYING',
    takeProfit: takeProfit,
    binanceMarket: datas,
    binanceTakeProfit1: {},
    binanceStopLoss: {}
  }
  const logCreated = await Log.create(data)
}

const updateLogStopLoss = async (symbol, data) => {
  const updated = await Log.updateOne(
    { symbol: symbol },
    { $set: { binanceStopLoss: data } }
  )
}

const updateLogTakeProfit = async (symbol, data) => {
  const updated = await Log.updateOne(
    { symbol: symbol },
    { $set: { binanceTakeProfit1: data } }
  )
}
