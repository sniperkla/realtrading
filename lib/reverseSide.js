const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')

const reverseSide = async (body, side, apiKey, secretKey) => {
  const { symbol, type, stopPriceCal } = body
  const getMarket = await Log.findOne({ symbol: symbol })

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
    minimum = Math.ceil(minimum * 1000) / 1000
  }

  const getStopLoss = await Log.findOne({
    symbol: symbol,
    binanceStopLoss: { $ne: null }
  })

  const qty = parseFloat(getMarket.binanceMarket.origQty)
  const closePosition = await apiBinance.postBinannce(
    symbol,
    side,
    qty,
    type,
    stopPriceCal,
    true,
    null,
    apiKey,
    secretKey
  )
  if (closePosition.status === 200) {
    const openPosition = await apiBinance.postBinannce(
      symbol,
      side,
      qty >= minimum ? qty : 0,
      type,
      stopPriceCal,
      true,
      null,
      apiKey,
      secretKey
    )
    if (openPosition.status === 200) {
      const updateOrder = await Log.updateOne(
        { symbol: symbol },
        {
          $set: {
            side: side,
            binanceMarket: closePosition.data
          }
        }
      )

      const buyit = {
        text: 'reverse',
        msg: `Reverse เสร็จสิ้น > ${symbol} เปลี่ยนเป็น ${side} \n QTY: ${openPosition?.data.origQty} \n orderId: ${openPosition?.data.orderId}\n side : ${openPosition?.data.side}`
      }
      await lineNotifyPost.postLineNotify(buyit)
    } else if (
      openPosition.data.msg === 'Quantity less than or equal to zero.'
    ) {
      const buyit = {
        text: 'reverse',
        msg: `ยกเลิก Reverse > ${symbol} QTY < ขั้นต่ำ รอ closePositon`
      }
      await lineNotifyPost.postLineNotify(buyit)
    }
    if (getStopLoss) {
      const orderIdStopLoss = getStopLoss?.binanceStopLoss?.orderId

      const stopPrice = parseFloat(getStopLoss?.binanceStopLoss?.stopPrice)

      const openOrderStopLoss = await apiBinance.postBinannce(
        symbol,
        side === 'BUY' ? 'SELL' : 'BUY',
        null,
        'STOP_MARKET',
        stopPrice,
        true,
        null,
        apiKey,
        secretKey
      )
      if (openOrderStopLoss.status === 200) {
        const cancleStopLoss = await apiBinance.cancleOrder(
          symbol,
          orderIdStopLoss,
          apiKey,
          secretKey
        )
        if (cancleStopLoss.status === 200) {
          const updateOrder = await Log.updateOne(
            { symbol: symbol },
            {
              $set: {
                binanceStopLoss: openOrderStopLoss.data
              }
            }
          )
          const getAccountInfo = await apiBinance.getAccountInfo(
            apiKey,
            secretKey
          )
          const unPNL = getAccountInfo.totalUnrealizedProfit
          const margin = getAccountInfo.totalMarginBalance
          const buyit = {
            symbol: symbol,
            text: 'updatestoploss',
            type: type,
            msg: `✅ ${symbol} : อัพเดท stoploss สำเร็จ \n🟡 เลื่อน stopLoss : ${stopPrice} \n💰 คงเหลือ :${margin} 💸 กำไรทิพย์ : ${unPNL}`
          }
          await lineNotifyPost.postLineNotify(buyit)
        }
      } else {
        const buyit = {
          symbol: symbol,
          text: 'updatestoploss',
          type: type,
          msg: `❌ ${symbol} : อัพเดท stoploss ไม่สำเร็จ \n🟡 เหตุผล : ${openOrderStopLoss?.data.msg}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      }
    }
  }
}

module.exports = { reverseSide }
