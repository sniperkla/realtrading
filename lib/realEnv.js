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
      takeProfit.takeprofit,
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
        takeProfit: takeProfit.takeprofit,
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

    // const binanceTakeProfit = await apiBinance.postBinannce(
    //   takeProfit.symbol,
    //   takeProfit.side,
    //   quantity,
    //   'LIMITFIRST',
    //   stopPriceCal,
    //   status,
    //   takeProfit.takeprofit,
    //   apiKey,
    //   secretKey
    // )

    // if (binanceTakeProfit.status === 200) {
    //   const buyit = {
    //     text: 'takeprofit',
    //     symbol: symbol,
    //     type: 'TAKE_PROFIT_MARKET',
    //     msg: `🟢 ${symbol} ตั้ง TakeProfit4Main สำเร็จ : ${takeProfit.takeprofit} 🟢`
    //   }
    //   await updateLogTakeProfit(symbol, binanceTakeProfit.data)
    //   await lineNotifyPost.postLineNotify(buyit)
    // } else if (binanceTakeProfit.status === 400) {
    //   const buyit = {
    //     text: 'error',
    //     symbol: takeProfit.symbol,
    //     type: takeProfit.type,
    //     msg: binanceTakeProfit.data.msg
    //   }
    //   await lineNotifyPost.postLineNotify(buyit)
    // }

    const binanceStopLoss = await apiBinance.postBinannce(
      symbol,
      takeProfit.side,
      quantity,
      'STOP_MARKET',
      stopPriceCal,
      status,
      takeProfit.takeprofit,
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

    const result = await takeprofit4Step.calTakeprofit4Step(
      takeProfit.symbol,
      takeProfit.side,
      quantity,
      takeProfit.type,
      stopPriceCal,
      status,
      takeProfit.takeprofit,
      apiKey,
      secretKey,
      minimum,
      priceCal,
      running,
      0.72,
      4,
      'z1'
    )

    const result2 = await takeprofit4Step.calTakeprofit4Step(
      takeProfit.symbol,
      takeProfit.side,
      result.remain,
      takeProfit.type,
      stopPriceCal,
      status,
      takeProfit.takeprofit,
      apiKey,
      secretKey,
      minimum,
      priceCal,
      running,
      1,
      1,
      'z2'
    )

    await orderTp(
      result,
      result2,
      takeProfit.side,
      takeProfit.symbol,
      takeProfit.type,
      apiKey,
      secretKey
    )
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
    { $set: { binanceTakeProfitCp: data } }
  )
}

const orderTp = async (
  result,
  result2,
  side,
  symbol,
  type,
  apiKey,
  secretKey
) => {
  let count = 0
  let binanceTakeProfitOrders1 = []
  let binanceTakeProfitOrders2 = []
  let binanceTakeProfitPayload = null
  let binanceTakeProfitPayloadCP = null
  for (let i = 0; i < result.tpDetail.tp.length; i++) {
    count = count + 1
    const binanceTakeProfit = {
      symbol: symbol,
      side: side,
      qty: parseFloat(result.tpDetail.tp[i].qty),
      type: 'TAKE_PROFIT_MARKET',
      stopPriceCal: 0,
      status: true,
      stopprice: parseFloat(result.tpDetail.tp[i].tp),
      apiKey: apiKey,
      secretKey: secretKey
    }
    binanceTakeProfitOrders1.push(binanceTakeProfit)

    const binanceTakeProfitPayload = await apiBinance.postBinannce(
      binanceTakeProfitOrders1[i].symbol,
      binanceTakeProfitOrders1[i].side,
      binanceTakeProfitOrders1[i].qty,
      binanceTakeProfitOrders1[i].type,
      binanceTakeProfitOrders1[i].stopPriceCal,
      binanceTakeProfitOrders1[i].status,
      binanceTakeProfitOrders1[i].stopprice,
      binanceTakeProfitOrders1[i].apiKey,
      binanceTakeProfitOrders1[i].secretKey
    )

    if (binanceTakeProfitPayload.status === 200) {
      await updateLogTakeProfit7Step(
        symbol,
        binanceTakeProfitPayload.data,
        `binanceTakeProfit` + (i + 1)
      )
      const buyit = {
        text: 'takeprofit',
        symbol: symbol,
        msg: `🟢 ${symbol} ตั้ง TakeProfit loop1 #${i + 1} สำเร็จ : ${
          binanceTakeProfitOrders1[i].stopprice
        } 🟢`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else {
      const buyit = {
        text: 'takeprofit',
        symbol: symbol,
        msg: `🟢 ${symbol} ตั้ง TakeProfit loop1 #${i + 1} ไม่สำเร็จ : ${
          binanceTakeProfitPayload.data.msg
        } 🟢`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
  }

  for (let i = 0; i < result2.tpDetail.tp.length; i++) {
    count = count + 1
    const binanceTakeProfit = {
      symbol: symbol,
      side: side,
      qty: result2.tpDetail.tp[i].qty,
      type: 'TAKE_PROFIT_MARKET',
      stopPriceCal: 0,
      status: true,
      stopprice: result2.tpDetail.tp[i].tp,
      apiKey: apiKey,
      secretKey: secretKey
    }
    binanceTakeProfitOrders2.push(binanceTakeProfit)

    if (result2.tpDetail.tp.length === i + 1) {
      console.log('debug result2', result2.tpDetail.tp)
      binanceTakeProfitPayloadCP = await apiBinance.postBinannce(
        binanceTakeProfitOrders2[i].symbol,
        binanceTakeProfitOrders2[i].side,
        binanceTakeProfitOrders2[i].qty,
        binanceTakeProfitOrders2[i].type,
        binanceTakeProfitOrders2[i].stopPriceCal,
        binanceTakeProfitOrders2[i].status,
        binanceTakeProfitOrders2[i].stopprice,
        binanceTakeProfitOrders2[i].apiKey,
        binanceTakeProfitOrders2[i].secretKey,
        true
      )
      if (binanceTakeProfitPayloadCP.status === 200) {
        await updateLogTakeProfit7Step(
          symbol,
          binanceTakeProfitPayloadCP.data,
          `binanceTakeProfitCp`
        )
        const buyit = {
          text: 'takeprofit',
          symbol: symbol,
          msg: `🟢 ${symbol} ตั้ง TakeProfit loop2 # CP สำเร็จ : ${binanceTakeProfitOrders2[i].stopprice} 🟢`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        {
          const buyit = {
            text: 'takeprofit',
            symbol: symbol,
            msg: `🟢 ${symbol} ตั้ง TakeProfit loop2  # CP ไม่สำเร็จ : ${binanceTakeProfitPayloadCP?.data.msg} 🟢`
          }
          await lineNotifyPost.postLineNotify(buyit)
        }
      }
    } else {
      binanceTakeProfitPayload = await apiBinance.postBinannce(
        binanceTakeProfitOrders2[i].symbol,
        binanceTakeProfitOrders2[i].side,
        binanceTakeProfitOrders2[i].qty,
        binanceTakeProfitOrders2[i].type,
        binanceTakeProfitOrders2[i].stopPriceCal,
        binanceTakeProfitOrders2[i].status,
        binanceTakeProfitOrders2[i].stopprice,
        binanceTakeProfitOrders2[i].apiKey,
        binanceTakeProfitOrders2[i].secretKey,
        false
      )
      if (binanceTakeProfitPayload.status === 200) {
        await updateLogTakeProfit7Step(
          symbol,
          binanceTakeProfitPayload.data,
          `binanceTakeProfit` + count
        )
        const buyit = {
          text: 'takeprofit',
          symbol: symbol,
          msg: `🟢 ${symbol} ตั้ง TakeProfit loop2 # ${count} สำเร็จ : ${binanceTakeProfitOrders2[i].stopprice} 🟢`
        }
        await lineNotifyPost.postLineNotify(buyit)
      } else {
        {
          const buyit = {
            text: 'takeprofit',
            symbol: symbol,
            msg: `🟢 ${symbol} ตั้ง TakeProfit loop2 # ${count} ไม่สำเร็จ : ${binanceTakeProfitPayload?.data.msg} 🟢`
          }
          await lineNotifyPost.postLineNotify(buyit)
        }
      }
    }
  }
}

const updateLogTakeProfit7Step = async (symbol, data, name) => {
  const updated = await Log.updateOne(
    { symbol: symbol },
    { $set: { [name]: data } }
  )
}
