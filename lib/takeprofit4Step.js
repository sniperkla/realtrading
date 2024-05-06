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
  let priceDistanceLong = takeprofit - priceCal
  let priceDistanceShort = priceCal - takeprofit
  let buyed = quantity
  let minSell = running
  let tpSelect = ''

  tpSet = [
    { tp: 'tp1', value: [100] },
    { tp: 'tp2', value: [50, 50] },
    { tp: 'tp3', value: [50, 25, 25] },
    { tp: 'tp4', value: [25, 25, 25, 25] }
  ]
  tpSet.map((tp) => {
    let check = tp.value.length
    let remain = quantity

    tp.value.map((item) => {
      let quantitySell = buyed * (item / 100)
      if (quantitySell >= minSell && remain - quantitySell >= 0) {
        remain = remain - quantitySell
        check--
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
    side === 'BUY' ? await LongTP4(bodyLong) : await ShortTP4(bodyShort)
  } else if (tpSelect === 'tp3') {
    side === 'BUY' ? await LongTP3(bodyLong) : await ShortTP3(bodyShort)
  } else if (tpSelect === 'tp2') {
    side === 'BUY' ? await LongTP2(bodyLong) : await ShortTP2(bodyShort)
  }
}
module.exports = { calTakeprofit4Step }

const LongTP4 = async (body) => {
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
  const takeprofit4 = priceCal + TP4L
  const quantity4 = quantity * 0.25
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
    quantity4
  )

  const TP3L = priceDistanceLong * 0.5
  const takeprofit3 = priceCal + TP3L
  const quantity3 = quantity * 0.25

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
    quantity3
  )

  const TP2L = priceDistanceLong * 0.75
  const takeprofit2 = priceCal + TP2L
  const quantity2 = quantity * 0.25

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
    quantity2
  )
}

const LongTP3 = async (body) => {
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
  const takeprofit3 = priceCal + TP3L
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
    quantity3
  )

  const TP2L = priceDistanceLong * 0.75
  const takeprofit2 = priceCal + TP2L
  const quantity2 = quantity * 0.25

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
    quantity2
  )
}

const LongTP2 = async (body) => {
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
  const takeprofit2 = priceCal + TP2L
  const quantity2 = quantity * 0.5

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
    quantity2
  )
}

const ShortTP4 = async (body) => {
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
  const quantity4 = quantity * 0.25

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
    quantity4
  )

  const TP3L = priceDistanceShort * 0.5
  const takeprofit3 = priceCal + TP3L
  const quantity3 = quantity * 0.25

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
    quantity3
  )

  const TP2L = priceDistanceShort * 0.75
  const takeprofit2 = priceCal + TP2L
  const quantity2 = quantity * 0.25

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
    quantity2
  )
}
const ShortTP3 = async (body) => {
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
    quantity3
  )

  const TP2L = priceDistanceShort * 0.75
  const takeprofit2 = priceCal - TP2L
  const quantity2 = quantity3 * 0.75

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
    quantity2
  )
}

const ShortTP2 = async (body) => {
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
  const takeprofit2 = priceCal - TP2L
  const quantity2 = quantity * 0.5

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
  const TP3Lname = 'binanceTakeProfit2'
  await checkStatus(
    binanceTakeProfit2,
    takeprofit2,
    symbol,
    TP3Lname,
    quantity2
  )
}

const checkStatus = async (
  binanceTakeProfit,
  takeprofit,
  symbol,
  name,
  quantity
) => {
  if (binanceTakeProfit.status === 200) {
    const buyit = {
      text: 'takeprofit',
      symbol: symbol,
      type: 'TAKE_PROFIT_MARKET',
      msg: `${symbol} From ${name} ตั้ง TakeProfit สำเร็จ : ${takeprofit} || QTY : ${quantity}`
    }
    await updateLogTakeProfit(symbol, binanceTakeProfit.data, name)
    await lineNotifyPost.postLineNotify(buyit)
  } else if (binanceTakeProfit.status === 400) {
    const buyit = {
      text: 'error',
      symbol: symbol,
      type: '',
      msg: binanceTakeProfit.data.msg
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
