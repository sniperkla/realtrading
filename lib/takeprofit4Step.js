const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')

const calTakeprofit4Step = async (
  symbol,
  side,
  quantity,
  type,
  stopPriceCal,
  status,
  takeprofit,
  apiKey,
  secretKey,
  minimum,
  priceCal,
  running
) => {
  const getExchange = await apiBinance.getExchangeInfo(apiKey, secretKey)

  const value = getExchange.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const qtyPrecision = value[0]?.quantityPrecision

  let priceDistanceLong = Math.abs(takeprofit - priceCal)
  let priceDistanceShort = Math.abs(priceCal - takeprofit)
  let buyed = parseFloat(quantity.toFixed(qtyPrecision))
  let minSell = running
  let tpSelect = ''
  let multiple = Math.pow(10, qtyPrecision)

  tpSet = [
    { tp: 'tp1', value: [100] },
    { tp: 'tp2', value: [50, 50] },
    { tp: 'tp3', value: [50, 25, 25] },
    { tp: 'tp4', value: [25, 25, 25, 25] }
  ]

  tpSet.map((tp) => {
    let check = tp.value.length
    let remain = buyed
    tp.value.map((item) => {
      if (remain < minSell && remain !== 0) {
        check--
        remain = 0
      } else {
        let quantitySell = buyed * (item / 100)
        if (quantitySell > minSell) {
          quantitySell = Math.floor(quantitySell * multiple) / multiple
        } else {
          quantitySell = Math.ceil(quantitySell * multiple) / multiple
        }
        if (quantitySell >= minSell && remain - quantitySell >= 0) {
          check--
          remain = remain - quantitySell
        }
      }
    })

    if (check === 0) {
      tpSelect = tp.tp
    }
  })

  const bodyLong = {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceLong,
    priceCal
  }
  const bodyShort = {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceShort,
    priceCal
  }
  if (tpSelect === 'tp4') {
    side === 'BUY'
      ? await LongTP4(bodyLong, qtyPrecision)
      : await ShortTP4(bodyShort, qtyPrecision)
  } else if (tpSelect === 'tp3') {
    side === 'BUY'
      ? await LongTP3(bodyLong, qtyPrecision)
      : await ShortTP3(bodyShort, qtyPrecision)
  } else if (tpSelect === 'tp2') {
    side === 'BUY'
      ? await LongTP2(bodyLong, qtyPrecision)
      : await ShortTP2(bodyShort, qtyPrecision)
  }
}
module.exports = { calTakeprofit4Step }

const LongTP4 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceLong,
    priceCal
  } = body

  const TP4L = priceDistanceLong * 0.25
  const takeprofit4 = priceCal - TP4L
  const quantity4 = checkQuantity(quantity * 0.25, qtyPrecision)
  const binanceTakeProfit4 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity4,
    type,
    stopPriceCal,
    status,
    takeprofit4,
    apiKey,
    secretKey
  )
  const TP4Lname = 'binanceTakeProfit4'
  await checkStatus(
    binanceTakeProfit4,
    takeprofit4,
    symbol,
    TP4Lname,
    quantity4,
    apiKey,
    secretKey,
    side
  )

  const TP3L = priceDistanceLong * 0.5
  const takeprofit3 = priceCal - TP3L
  const quantity3 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit3 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity3,
    type,
    stopPriceCal,
    status,
    takeprofit3,
    apiKey,
    secretKey
  )

  const TP3Lname = 'binanceTakeProfit3'
  await checkStatus(
    binanceTakeProfit3,
    takeprofit3,
    symbol,
    TP3Lname,
    quantity3,
    apiKey,
    secretKey,
    side
  )

  const TP2L = priceDistanceLong * 0.75
  const takeprofit2 = priceCal - TP2L
  const quantity2 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'
  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}

const LongTP3 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceLong,
    priceCal
  } = body
  const TP3L = priceDistanceLong * 0.5
  const takeprofit3 = priceCal - TP3L
  const quantity3 = quantity * 0.5

  const binanceTakeProfit3 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity3,
    type,
    stopPriceCal,
    status,
    takeprofit3,
    apiKey,
    secretKey
  )
  const TP3Lname = 'binanceTakeProfit3'
  await checkStatus(
    binanceTakeProfit3,
    takeprofit3,
    symbol,
    TP3Lname,
    quantity3,
    apiKey,
    secretKey,
    side
  )
  const TP2L = priceDistanceLong * 0.75
  const takeprofit2 = priceCal - TP2L
  const quantity2 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'
  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}

const LongTP2 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceLong,
    priceCal
  } = body
  const TP2L = priceDistanceLong * 0.5
  const takeprofit2 = priceCal - TP2L
  const quantity2 = checkQuantity(quantity * 0.5, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'
  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}

const ShortTP4 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceShort,
    priceCal
  } = body
  const TP4L = priceDistanceShort * 0.25
  const takeprofit4 = priceCal + TP4L
  const quantity4 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit4 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity4,
    type,
    stopPriceCal,
    status,
    takeprofit4,
    apiKey,
    secretKey
  )
  const TP4Lname = 'binanceTakeProfit4'

  await checkStatus(
    binanceTakeProfit4,
    takeprofit4,
    symbol,
    TP4Lname,
    quantity4,
    apiKey,
    secretKey,
    side
  )

  const TP3L = priceDistanceShort * 0.5
  const takeprofit3 = priceCal + TP3L
  const quantity3 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit3 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity3,
    type,
    stopPriceCal,
    status,
    takeprofit3,
    apiKey,
    secretKey
  )

  const TP3Lname = 'binanceTakeProfit3'

  await checkStatus(
    binanceTakeProfit3,
    takeprofit3,
    symbol,
    TP3Lname,
    quantity3,
    apiKey,
    secretKey,
    side
  )

  const TP2L = priceDistanceShort * 0.75
  const takeprofit2 = priceCal + TP2L
  const quantity2 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'

  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}
const ShortTP3 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceShort,
    priceCal
  } = body
  const TP3L = priceDistanceShort * 0.5
  const takeprofit3 = priceCal + TP3L
  const quantity3 = checkQuantity(quantity * 0.5, qtyPrecision)

  const binanceTakeProfit3 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity3,
    type,
    stopPriceCal,
    status,
    takeprofit3,
    apiKey,
    secretKey
  )
  const TP3Lname = 'binanceTakeProfit3'

  await checkStatus(
    binanceTakeProfit3,
    takeprofit3,
    symbol,
    TP3Lname,
    quantity3,
    apiKey,
    secretKey,
    side
  )

  const TP2L = priceDistanceShort * 0.75
  const takeprofit2 = priceCal + TP2L
  const quantity2 = checkQuantity(quantity * 0.25, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'

  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}

const ShortTP2 = async (body, qtyPrecision) => {
  const {
    symbol,
    side,
    quantity,
    type,
    stopPriceCal,
    status,
    takeprofit,
    apiKey,
    secretKey,
    priceDistanceShort,
    priceCal
  } = body
  const TP2L = priceDistanceShort * 0.5
  const takeprofit2 = priceCal + TP2L
  const quantity2 = checkQuantity(quantity * 0.5, qtyPrecision)

  const binanceTakeProfit2 = await apiBinance.postBinannce(
    symbol,
    side,
    quantity2,
    type,
    stopPriceCal,
    status,
    takeprofit2,
    apiKey,
    secretKey
  )
  const TP2Lname = 'binanceTakeProfit2'
  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP2Lname,
    quantity2,
    apiKey,
    secretKey,
    side
  )
}

const checkStatus = async (binanceTakeProfit, takeprofit, symbol, name) => {
  if (binanceTakeProfit.status === 200) {
    const buyit = {
      text: 'takeprofit',
      symbol: symbol,
      type: 'TAKE_PROFIT_MARKET',
      msg: `${symbol} From ${name} ตั้ง TakeProfit สำเร็จ : ${takeprofit}  `
    }
    await updateLogTakeProfit(symbol, binanceTakeProfit.data, name)
    await lineNotifyPost.postLineNotify(buyit)
  } else if (binanceTakeProfit.status === 400) {
    const buyit = {
      text: 'error',
      symbol: symbol,
      type: '',
      msg: `${
        binanceTakeProfit.data.msg
      }\nName: ${name}\n{"symbol":"${symbol}","side":"${side}","quantity":${parseFloat(
        quantity?.toFixed(qtyPrecision)
      )},"takeprofit":${parseFloat(takeprofit?.toFixed(pricePrecision))}}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const updateLogTakeProfit = async (symbol, data, name) => {
  const updated = await Log.updateOne(
    { symbol: symbol },
    { $set: { [name]: data } }
  )
}

const checkQuantity = (quantity, qtyPrecision) => {
  const multiple = Math.pow(10, qtyPrecision)
  const quantitys = Math.floor(quantity * multiple) / multiple
  return quantitys
}

// const apiBinance = require('../lib/apibinance')
// const lineNotifyPost = require('../lib/lineNotifyPost')
// const Log = require('../model/log')

// const calTakeprofit4Step = async (
//   symbol,
//   side,
//   quantity,
//   type,
//   stopPriceCal,
//   status,
//   takeprofit,
//   apiKey,
//   secretKey,
//   minimum,
//   priceCal,
//   running
// ) => {
//   let priceDistanceLong = Math.abs(takeprofit - priceCal)
//   let priceDistanceShort = Math.abs(priceCal - takeprofit)
//   let buyed = quantity
//   let minSell = running
//   let tpSelect = ''

//   tpSet = [
//     { tp: 'tp1', value: [100] },
//     { tp: 'tp2', value: [50, 50] },
//     { tp: 'tp3', value: [50, 25, 25] },
//     { tp: 'tp4', value: [25, 25, 25, 25] }
//   ]
//   tpSet.map((tp) => {
//     let check = tp.value.length
//     let remain = quantity

//     tp.value.map((item) => {
//       let quantitySell = buyed * (item / 100)
//       if (quantitySell >= minSell && remain - quantitySell >= 0) {
//         remain = remain - quantitySell
//         check--
//       }
//     })
//     if (check === 0) {
//       tpSelect = tp.tp
//     }
//   })
//   const bodyLong = {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceLong,
//     priceCal
//   }
//   const bodyShort = {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceShort,
//     priceCal
//   }
//   if (tpSelect === 'tp4') {
//     side === 'BUY' ? await LongTP4(bodyLong) : await ShortTP4(bodyShort)
//   } else if (tpSelect === 'tp3') {
//     side === 'BUY' ? await LongTP3(bodyLong) : await ShortTP3(bodyShort)
//   } else if (tpSelect === 'tp2') {
//     side === 'BUY' ? await LongTP2(bodyLong) : await ShortTP2(bodyShort)
//   }
// }
// module.exports = { calTakeprofit4Step }

// const LongTP4 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceLong,
//     priceCal
//   } = body

//   const TP4L = priceDistanceLong * 0.25
//   const takeprofit4 = priceCal - TP4L
//   const quantity4 = quantity * 0.25
//   const binanceTakeProfit4 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity4,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit4,
//     apiKey,
//     secretKey
//   )
//   const TP4Lname = 'binanceTakeProfit4'
//   await checkStatus(
//     binanceTakeProfit4,
//     takeprofit4,
//     symbol,
//     TP4Lname,
//     quantity4,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP3L = priceDistanceLong * 0.5
//   const takeprofit3 = priceCal - TP3L
//   const quantity3 = quantity * 0.25

//   const binanceTakeProfit3 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity3,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit3,
//     apiKey,
//     secretKey
//   )

//   const TP3Lname = 'binanceTakeProfit3'
//   await checkStatus(
//     binanceTakeProfit3,
//     takeprofit3,
//     symbol,
//     TP3Lname,
//     quantity3,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP2L = priceDistanceLong * 0.75
//   const takeprofit2 = priceCal - TP2L
//   const quantity2 = quantity * 0.25

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TP2Lname = 'binanceTakeProfit2'
//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TP2Lname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }

// const LongTP3 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceLong,
//     priceCal
//   } = body
//   const TP3L = priceDistanceLong * 0.5
//   const takeprofit3 = priceCal - TP3L
//   const quantity3 = quantity * 0.5

//   const binanceTakeProfit3 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity3,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit3,
//     apiKey,
//     secretKey
//   )
//   const TP3Lname = 'binanceTakeProfit3'
//   await checkStatus(
//     binanceTakeProfit3,
//     takeprofit3,
//     symbol,
//     TP3Lname,
//     quantity3,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP2L = priceDistanceLong * 0.75
//   const takeprofit2 = priceCal - TP2L
//   const quantity2 = quantity * 0.25

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TP2Lname = 'binanceTakeProfit2'
//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TP2Lname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }

// const LongTP2 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceLong,
//     priceCal
//   } = body
//   const TP2L = priceDistanceLong * 0.5
//   const takeprofit2 = priceCal - TP2L
//   const quantity2 = quantity * 0.5

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TP2Lname = 'binanceTakeProfit2'
//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TP2Lname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }

// const ShortTP4 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceShort,
//     priceCal
//   } = body
//   const TP4S = priceDistanceShort * 0.25
//   const takeprofit4 = priceCal + TP4S
//   const quantity4 = quantity * 0.25

//   const binanceTakeProfit4 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity4,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit4,
//     apiKey,
//     secretKey
//   )
//   const TP4Sname = 'binanceTakeProfit4'

//   await checkStatus(
//     binanceTakeProfit4,
//     takeprofit4,
//     symbol,
//     TP4Sname,
//     quantity4,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP3S = priceDistanceShort * 0.5
//   const takeprofit3 = priceCal + TP3S
//   const quantity3 = quantity * 0.25

//   const binanceTakeProfit3 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity3,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit3,
//     apiKey,
//     secretKey
//   )

//   const TP3Sname = 'binanceTakeProfit3'

//   await checkStatus(
//     binanceTakeProfit3,
//     takeprofit3,
//     symbol,
//     TP3Sname,
//     quantity3,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP2S = priceDistanceShort * 0.75
//   const takeprofit2 = priceCal + TP2S
//   const quantity2 = quantity * 0.25

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TP2Sname = 'binanceTakeProfit2'

//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TP2Sname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }
// const ShortTP3 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceShort,
//     priceCal
//   } = body
//   const TP3S = priceDistanceShort * 0.5
//   const takeprofit3 = priceCal + TP3S
//   const quantity3 = quantity * 0.5

//   const binanceTakeProfit3 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity3,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit3,
//     apiKey,
//     secretKey
//   )
//   const TP3Sname = 'binanceTakeProfit3'

//   await checkStatus(
//     binanceTakeProfit3,
//     takeprofit3,
//     symbol,
//     TP3Sname,
//     quantity3,
//     apiKey,
//     secretKey,
//     side
//   )

//   const TP2S = priceDistanceShort * 0.75
//   const takeprofit2 = priceCal + TP2S
//   const quantity2 = quantity3 * 0.75

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TP2Sname = 'binanceTakeProfit2'

//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TP2Sname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }

// const ShortTP2 = async (body) => {
//   const {
//     symbol,
//     side,
//     quantity,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit,
//     apiKey,
//     secretKey,
//     priceDistanceShort,
//     priceCal
//   } = body
//   const TP2S = priceDistanceShort * 0.5
//   const takeprofit2 = priceCal + TP2S
//   const quantity2 = quantity * 0.5

//   const binanceTakeProfit2 = await apiBinance.postBinannce(
//     symbol,
//     side,
//     quantity2,
//     type,
//     stopPriceCal,
//     status,
//     takeprofit2,
//     apiKey,
//     secretKey
//   )
//   const TPS2Lname = 'binanceTakeProfit2'
//   await checkStatus(
//     binanceTakeProfit2,
//     takeprofit2,
//     symbol,
//     TPS2Lname,
//     quantity2,
//     apiKey,
//     secretKey,
//     side
//   )
// }

// const checkStatus = async (
//   binanceTakeProfit,
//   takeprofit,
//   symbol,
//   name,
//   quantity,
//   apiKey,
//   secretKey,
//   side
// ) => {
//   const getExchange = await apiBinance.getExchangeInfo(apiKey, secretKey)
//   const value = getExchange.data.symbols.filter((item) => {
//     return item.symbol === symbol
//   })
//   const pricePrecision = value[0]?.pricePrecision
//   const qtyPrecision = value[0]?.quantityPrecision

//   if (binanceTakeProfit.status === 200) {
//     const buyit = {
//       text: 'takeprofit',
//       symbol: symbol,
//       type: 'TAKE_PROFIT_MARKET',
//       msg: `${symbol} From ${name} ตั้ง TakeProfit สำเร็จ : ${takeprofit} || QTY : ${parseFloat(
//         quantity?.toFixed(qtyPrecision)
//       )}`
//     }
//     await updateLogTakeProfit(symbol, binanceTakeProfit.data, name)
//     await lineNotifyPost.postLineNotify(buyit)
//   } else if (binanceTakeProfit.status === 400) {
//     const buyit = {
//       text: 'error',
//       symbol: symbol,
//       type: '',
//       msg: `${
//         binanceTakeProfit.data.msg
//       }\nName: ${name}\n{"symbol":"${symbol}","side":"${side}","quantity":${parseFloat(
//         quantity?.toFixed(qtyPrecision)
//       )},"takeprofit":${parseFloat(takeprofit?.toFixed(pricePrecision))}}`
//     }
//     await lineNotifyPost.postLineNotify(buyit)
//   }
// }

// const updateLogTakeProfit = async (symbol, data, name) => {
//   const updated = await Log.updateOne(
//     { symbol: symbol },
//     { $set: { [name]: data } }
//   )
// }
