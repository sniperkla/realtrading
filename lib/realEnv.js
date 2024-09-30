const Log = require('../model/log')
const apiBinance = require('./apibinance')
const lineNotifyPost = require('./lineNotifyPost')
const callLeverage = require('../lib/calLeverage')
const storesl = require('../model/storesl')

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

    // const stopPriceCal = body?.stopPriceCal
    // const R = 2
    // const preRR = R * (priceCal - stopPriceCal)
    // const RR = priceCal + preRR

    const checkStoreSL = await storesl.findOne({
      symbol: body.symbol
    })

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
      if (
        binanceMarket.data?.code === -2072 ||
        binanceMarket.data?.code === '-2072'
      ) {
        const calLeverage = await callLeverage.reLeverageCal(
          symbol,
          priceCal,
          stopPriceCal,
          side,
          apiKey,
          secretKey,
          leverage,
          5
        )
        const type = 'MARKET'
        const finalBody = {
          symbol,
          priceCal,
          type,
          stopPriceCal,
          side,
          quantity: calLeverage.maximumQty,
          leverage: calLeverage.defaultLeverage,
          budget: calLeverage.budget,
          minimum: calLeverage.minimum,
          openLongShort: calLeverage.openLongShort,
          st: calLeverage.st,
          valueAskBid: calLeverage.valueAskBid,
          price: calLeverage.price,
          bids: calLeverage.bids,
          asks: calLeverage.asks,
          marginStart: calLeverage.marginStart,
          marginEnd: calLeverage.marginEnd,
          lpStart: calLeverage.lpStart,
          lpEnd: calLeverage.lpEnd,
          qtyStart: calLeverage.qtyStart,
          qtyEnd: calLeverage.qtyEnd,
          marginEnd2: calLeverage.marginEnd2,
          lpEnd2: calLeverage.lpEnd2,
          qtyEnd2: calLeverage.qtyEnd2,
          priceCal: calLeverage.priceCal,
          running: calLeverage.running
        }
        await buyingBinance(finalBody)
      }
    } else if (binanceMarket?.status === 200) {
      const log = await Log.findOne({ symbol: symbol })
      if (!log) {
        await createLog(symbol, side, binanceMarket?.data)
      }
      const defaultMargins = await apiBinance?.getDefultMagin(apiKey, secretKey)
      const initialMargin = defaultMargins?.filter((item) => {
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
        // takeProfit: RR
      }
      await lineNotifyPost.postLineNotify(buyit)
    }

    // const binanceTakeProfit = await apiBinance.postBinannce(
    //   symbol,
    //   side,
    //   0,
    //   'LIMITFIRST',
    //   stopPriceCal,
    //   status,
    //   RR,
    //   apiKey,
    //   secretKey
    // )

    const binanceStopLoss = await apiBinance.postBinannce(
      symbol,
      side === 'BUY' ? 'SELL' : 'BUY',
      quantity,
      'STOP_MARKET',
      side === 'SELL'
        ? checkStoreSL?.stopPriceCalSell
        : checkStoreSL?.stopPriceCalBuy,
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
        msg: `🔴 ${symbol} ตั้ง StopLoss สำเร็จ\n                     ${
          side === 'SELL'
            ? checkStoreSL?.stopPriceCalSell
            : checkStoreSL?.stopPriceCalBuy
        } 🔴`
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

    // if (binanceTakeProfit.status === 200) {
    //   const buyit = {
    //     text: 'takeprofit',
    //     symbol: symbol,
    //     msg: `🟢 ${symbol} ตั้ง Takeprofit สำเร็จ\n                     ${RR} 🟢`
    //   }
    //   await updateLogTakeProfit(symbol, binanceTakeProfit.data)
    //   await lineNotifyPost.postLineNotify(buyit)
    // } else if (binanceTakeProfit.status === 400) {
    //   const buyit = {
    //     text: 'error',
    //     symbol: symbol,
    //     msg: binanceTakeProfit.data.msg
    //   }
    //   await lineNotifyPost.postLineNotify(buyit)
    // }
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

const createLog = async (symbol, side, datas) => {
  let data = {
    symbol: symbol,
    side: side,
    status: 'BUYING',
    binanceMarket: datas,
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

// const updateLogTakeProfit = async (symbol, data) => {
//   const updated = await Log.updateOne(
//     { symbol: symbol },
//     { $set: { binanceTakeProfit: data } }
//   )
// }

// const reBuyingMarket = async (
//   symbol,
//   side,
//   quantity,
//   type,
//   stopPriceCal,
//   status,
//   apiKey,
//   secretKey,
//   leverage
// ) => {
//   await apiBinance.changeLeverage(symbol, leverage - 1, apiKey, secretKey)
//   await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     null,
//     apiKey,
//     secretKey
//   )
// }
