const apiBinance = require('../lib/apibinance')
const lineNotifyPost = require('../lib/lineNotifyPost')
const Log = require('../model/log')
const trading = require('../model/trading')

const axios = require('axios')
require('dotenv').config()

const checkTakeProfit4Step = async () => {
  const log = await Log.find()

  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo.totalUnrealizedProfit
  const margin = getAccountInfo.totalMarginBalance

  const symbol = log.map((item) => {
    return item.symbol
  })

  for (let i = 0; i < symbol.length; i++) {
    const checkMarket = await Log.findOne({
      symbol: symbol[i]
    })

    const checkTakeOrCancleTakeProfit = await apiBinance?.getOrder(
      checkMarket?.binanceTakeProfitCp?.orderId,
      symbol[i],
      apiKey,
      secretKey
    )

    const checkTakeOrCancleStopLoss = await apiBinance?.getOrder(
      checkMarket?.binanceStopLoss?.orderId,
      symbol[i],
      apiKey,
      secretKey
    )
    if (
      checkTakeOrCancleTakeProfit?.status === 'FILLED' ||
      checkTakeOrCancleTakeProfit?.status === 'EXPIRED' ||
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
    ) {
      console.log(`processing on :${symbol[i]}`)
      for (let j = 1; j <= 4; j++) {
        let takeProfitProperty = `binanceTakeProfit${j}`
        if (checkMarket?.[takeProfitProperty]?.orderId) {
          const cancleTakeProfit = await apiBinance?.cancleOrder(
            symbol[i],
            checkMarket?.[takeProfitProperty]?.orderId,
            apiKey,
            secretKey
          )
        }
      }
      const cancleOrderStopLoss = await apiBinance?.cancleOrder(
        symbol[i],
        checkMarket?.binanceStopLoss?.orderId,
        apiKey,
        secretKey
      )
      let buyit = {}
      checkTakeOrCancleStopLoss?.status === 'FILLED' ||
      checkTakeOrCancleStopLoss?.status === 'PARTIALLY_FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `🔻 เหรียญ : ${symbol[i]} StopLoss ไปแล้ว  | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔻`
          })
        : checkTakeOrCancleTakeProfit?.status === 'FILLED'
        ? (buyit = {
            text: 'filled',
            msg: `🔺 เหรียญ : ${symbol[i]} TakeProfit ไปแล้ว | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔺`
          })
        : (buyit = {
            text: 'filled',
            msg: `🔻 เหรียญ : ${symbol[i]} Liquidation ไปแล้ว | คงเหลือ :${margin} , กำไรทิพย์ : ${unPNL} 🔻`
          })
      await lineNotifyPost.postLineNotify(buyit)
      await checkStatusZone()
      await Log.deleteOne({ symbol: symbol[i] })
    } else {
      console.log('do nothing')
    }
  }
  console.log('CronJob Check TakeProfit And Stoploss done')
}

const checkStopLoss4Step = async () => {
  const log = await Log.find()
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  let marketSide = 0
  let stopPriceCal = 0
  const symbol = log.map((item) => {
    return item.symbol
  })

  for (let i = 0; i < symbol.length; i++) {
    const checkMarket = await Log.findOne({
      symbol: symbol[i]
    })

    let name = ''
    const checkTakeprofitZone = checkMarket?.takeProfitZone
    const marketPrice = await trading.findOne({ symbol: symbol[i] })
    const getPrice = await apiBinance.getPrice(symbol[i], apiKey, secretKey)

    const side1 = checkMarket.side
    let side = ''
    const orderId = checkMarket?.binanceStopLoss?.orderId
    marketSide = parseFloat(marketPrice?.priceCal * 0.007)

    if (side1 === 'BUY') {
      side = 'SELL'
    } else if (side1 === 'SELL') {
      side = 'BUY'
    }

    if (side === 'BUY') {
      if (getPrice <= checkTakeprofitZone?.zone4) {
        if (checkMarket?.lockStopLoss?.zone4 === true) {
          return 0
        }
        name = 'zone80'
        stopPriceCal = parseFloat(checkTakeprofitZone?.zone2)
        console.log('debug stoppriceZone3 SELL', stopPriceCal)

        await Log.findOneAndUpdate(
          { symbol: symbol[i] },
          {
            lockStopLoss: {
              zone1: false,
              zone2: false,
              zone3: false,
              zone4: true,
              lock: true
            }
          }
        )
        await updateStopLoss(
          symbol[i],
          stopPriceCal,
          side,
          apiKey,
          secretKey,
          orderId,
          name
        )
      } else if (
        getPrice <= checkTakeprofitZone?.zone3 &&
        checkMarket?.lockStopLoss?.zone4 === false
      ) {
        if (checkMarket?.lockStopLoss?.zone3 === true) {
          return 0
        }
        name = 'zone60'
        stopPriceCal = parseFloat(checkTakeprofitZone?.zone1)
        console.log('debug stoppriceZone2 SELL', stopPriceCal)

        await Log.findOneAndUpdate(
          { symbol: symbol[i] },
          {
            lockStopLoss: {
              zone1: false,
              zone2: false,
              zone3: true,
              zone4: false,
              lock: true
            }
          }
        )
        await updateStopLoss(
          symbol[i],
          stopPriceCal,
          side,
          apiKey,
          secretKey,
          orderId,
          name
        )
      }
    } else if (side === 'SELL') {
      if (getPrice >= checkTakeprofitZone?.zone4) {
        if (checkMarket?.lockStopLoss?.zone4 === true) {
          return 0
        }
        name = 'zone80'
        stopPriceCal = parseFloat(checkTakeprofitZone?.zone2)
        console.log('debug stoppriceZone3 SELL', stopPriceCal)

        await Log.findOneAndUpdate(
          { symbol: symbol[i] },
          {
            lockStopLoss: {
              zone1: false,
              zone2: false,
              zone3: false,
              zone4: true,
              lock: true
            }
          }
        )
        await updateStopLoss(
          symbol[i],
          stopPriceCal,
          side,
          apiKey,
          secretKey,
          orderId,
          name
        )
      } else if (
        getPrice >= checkTakeprofitZone?.zone3 &&
        checkMarket?.lockStopLoss?.zone4 === false
      ) {
        if (checkMarket?.lockStopLoss?.zone3 === true) {
          return 0
        }
        name = 'zone60'
        stopPriceCal = parseFloat(checkTakeprofitZone?.zone1)
        console.log('debug stoppriceZone2 SELL', stopPriceCal)

        await Log.findOneAndUpdate(
          { symbol: symbol[i] },
          {
            lockStopLoss: {
              zone1: false,
              zone2: false,
              zone3: true,
              zone4: false,
              lock: true
            }
          }
        )
        await updateStopLoss(
          symbol[i],
          stopPriceCal,
          side,
          apiKey,
          secretKey,
          orderId,
          name
        )
      }
    }
  }

  console.log('CronJob Set Stoploss By Zone Done')
}

module.exports = { checkTakeProfit4Step, checkStopLoss4Step }

const updateStopLoss = async (
  symbol,
  stopPriceCal,
  side,
  apiKey,
  secretKey,
  orderId,
  name
) => {
  const data = await apiBinance.postBinannce(
    symbol,
    side,
    null,
    'STOP_MARKET',
    stopPriceCal,
    true,
    null,
    apiKey,
    secretKey
  )

  if (data.status === 200) {
    const x = await apiBinance?.cancleOrder(symbol, orderId, apiKey, secretKey)

    await Log.updateOne(
      { symbol: symbol },
      { $set: { 'binanceStopLoss': data.data, 'lockStopLoss.lock': true } }
    )
    const buyit = {
      text: 'updatestoploss',
      msg: `${symbol} Stoploss By Zone ถูกเลื่อน ไปยัง ${name} : ${stopPriceCal}`
    }
    await lineNotifyPost.postLineNotify(buyit)
    await checkStatusZone()
  } else {
    const buyit = {
      text: 'updatestoploss',
      msg: `${data.data.msg}`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const checkStatusZone = async () => {
  const find25 = await Log.find()

  let alls = {}
  alls = find25.map((item) => {
    return {
      zone3: item.lockStopLoss.zone3,
      zone4: item.lockStopLoss.zone4
    }
  })

  const zone3 = alls.filter((item) => {
    return item.zone3 === true
  })
  const zone4 = alls.filter((item) => {
    return item.zone4 === true
  })

  const buyit = {
    text: 'updatestoploss',
    msg: `SUMMARY  zone60: ${zone3?.length} / zone80: ${zone4?.length} `
  }
  await lineNotifyPost.postLineNotify(buyit)
}
