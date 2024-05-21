const express = require('express')
const HTTPStatus = require('http-status')
const app = express()
const port = 3050
const cors = require('cors')
const bodyParser = require('body-parser')
const Trading = require('./model/trading')
const Log = require('./model/log')
const lineNotifyPost = require('./lib/lineNotifyPost')
const apiBinance = require('./lib/apibinance')
const callLeverage = require('./lib/calLeverage')
const realEnvironment = require('./lib/realEnv')
const combine = require('./lib/combineUser')
const reverse = require('./lib/reverseSide')
const checkConditionOBOS = require('./lib/checkCondition')
const cron = require('node-cron')
const cronJub = require('./lib/cronJob')

const updateMarketCounter = require('./lib/checkMarketCounter')
const get = combine.combineUser()

require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const mongoose = require('mongoose')
const pathName = process.env.NAME
const connectionString = `${process.env.DB}` + `${pathName}`

mongoose
  .connect(connectionString, {
    useNewUrlParser: true
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('Error connecting to MongoDB:', err))
let bodyq = null
app.get(`/getbinance_${pathName}`, async (req, res) => {
  try {
    

    //test
    return res.status(HTTPStatus.OK).json({ success: true, data: Date.now() })
  } catch (error) {}
})

const scheduleForakeProfit4Step = '*/40 * * * * *'

const doCheckTakeProfit4Step = async () => {
  await cronJub.checkTakeProfit4Step()
}

const task1 = cron.schedule(scheduleForakeProfit4Step, doCheckTakeProfit4Step)

task1.start()

app.post(`/gettrading_${pathName}`, async (req, res) => {
  try {
    const limitMarket = 1000
    bodyq = req.body

    let body = await checkDataFirst(bodyq)

    if (body?.type === 'MARKET' && bodyq?.version === 'v3') {
      const checkMarketFirst = await Log.findOne({ symbol: body.symbol })
      if (checkMarketFirst?.side === body.side) {
        console.log('do nithing')
        return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
      } else if (checkMarketFirst?.side !== body.side && checkMarketFirst) {
        await reverse.reverseSide(
          body,
          body.side,
          get.API_KEY[0],
          get.SECRET_KEY[0]
        )
        return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
      }
      const checkLimitMarket = await updateMarketCounter.incCounter()
      if (checkLimitMarket <= limitMarket) {
        const getAllOpenOrder = await apiBinance.getAllOpenOrder(
          get.API_KEY[0],
          get.SECRET_KEY[0]
        )
        const checkOpenOrder = getAllOpenOrder.filter((item) => {
          return (
            item.type === 'TAKE_PROFIT_MARKET' && item.closePosition === true
          )
        })
        if (checkOpenOrder?.length < 100) {
          const checkMarketFirst = await Log.findOne({ symbol: body.symbol })
          if (checkMarketFirst === null) {
            const calLeverage = await callLeverage.leverageCal(
              body.symbol,
              body.priceCal,
              body.stopPriceCal,
              body.side,
              get.API_KEY[0],
              get.SECRET_KEY[0]
            )
            checkCondition(
              body,
              res,
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
            await updateMarketCounter.deleteCounter()
            console.log('arleady have market')
          }
        } else {
          const buyit = {
            text: 'overTrade',
            msg: `เกินลิมิตเทรด > ${checkOpenOrder.length} | ชื่อเหรียญ : ${body.symbol}`
          }
          await lineNotifyPost.postLineNotify(buyit)
          await updateMarketCounter.deleteCounter()
        }
      } else {
        const buyit = {
          text: 'overTrade',
          msg: `กำลังคำนวณ Market เหลืออีก ${checkLimitMarket} Quene`
        }
        await lineNotifyPost.postLineNotify(buyit)
        await updateMarketCounter.deleteCounter()
      }
    } else {
      await checkConditionOBOS.checkConditionOBOS(
        body,
        res,
        get.API_KEY[0],
        get.SECRET_KEY[0]
      )
    }
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {}
})

const checkCondition = async (
  body,
  res,
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

    if (body.type === 'MARKET') {
      let en = {
        ...finalBody,
        apiKey: get.API_KEY[0],
        secretKey: get.SECRET_KEY[0]
      }
      await realEnvironment.buyingBinance(en)
      // }
    }

    // } else if (
    //   body.type === 'STOP_MARKET' && body.version ==='v3'
    // ) {
    //   await checkStopLoss(body)
    // }

    return res.status(HTTPStatus.OK).json({ success: true, data: 'ไม่ๆๆๆ' })
  } catch (error) {}
}

const checkStopLoss = async (body) => {
  try {
    const { symbol, side, type, stopPrice } = body

    const qty = 0
    const status = true
    // check order first
    const checkMarket = await Log.findOne({
      symbol: symbol
    })

    const check = await Log.findOne({
      'symbol': symbol,
      'binanceStopLoss.symbol': symbol
    })

    if (check) {
      const data = await apiBinance.postBinannce(
        symbol,
        side,
        qty,
        type,
        stopPrice,
        status,
        'takeprofit',
        get.API_KEY[0],
        get.SECRET_KEY[0]
      )

      if (data.status === 200) {
        await apiBinance.cancleOrder(
          symbol,
          check.binanceStopLoss.orderId,
          get.API_KEY[0],
          get.SECRET_KEY[0]
        )
        await Log.findOneAndUpdate(
          { symbol: symbol },
          {
            $set: { binanceStopLoss: data.data }
          },
          { upsert: true }
        )
        const updated = await Log.updateOne(
          { symbol: symbol },
          { $set: { binanceStopLoss: data.data } }
        )
        const getAccountInfo = await apiBinance.getAccountInfo(
          get.API_KEY[0],
          get.SECRET_KEY[0]
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
    } else if (checkMarket !== null && check === null) {
      const data = await apiBinance.postBinannce(
        symbol,
        side,
        qty,
        type,
        stopPrice,
        status,
        'takeprofit',
        get.API_KEY[0],
        get.SECRET_KEY[0]
      )

      if (data.status === 200) {
        const updated = await Log.updateOne(
          { symbol: symbol },
          { $set: { binanceStopLoss: data.data } }
        )

        const buyit = {
          symbol: symbol,
          text: 'updatestoploss',
          type: type,
          msg: `${symbol} : อัพเดท stoploss สำเร็จ , เลื่อน : ${stopPrice}`
        }
        await lineNotifyPost.postLineNotify(buyit)
      }
    }
  } catch (error) {}
}

const checkMarketBody = (body) => {
  let real = {}

  real = {
    type: body.type,
    version: body.type,
    side: body.side,
    symbol: body.symbol,
    priceCal: parseFloat(body.priceCal),
    stopPriceCal: parseFloat(body.stopPriceCal)
  }
  return real
}

const checkStopLossBody = (bodyq) => {
  let real = {}

  real = {
    type: bodyq.type,
    side: bodyq.side,
    symbol: bodyq.symbol,
    price: parseFloat(bodyq.price),
    stopPrice: parseFloat(bodyq.stopPrice)
  }

  return real
}

const checkDataFirst = async (bodyq) => {
  if (bodyq.type === 'MARKET') {
    const modifiedBody = { ...bodyq, symbol: bodyq.symbol.replace(/\.P$/, '') }

    const bodyMarket = checkMarketBody(modifiedBody)

    const checkData = await Trading.findOne({
      symbol: bodyMarket.symbol,
      type: bodyMarket.type
    })

    if (checkData) {
      await Trading.updateOne(
        {
          symbol: bodyMarket.symbol,
          type: bodyMarket.type
        },
        bodyMarket,
        { upsert: true }
      )
    }
    if (!checkData) await Trading.create(bodyMarket)

    return bodyMarket
  } else if (bodyq?.type === 'STOP_MARKET') {
    let body = {
      ...bodyq,
      symbol: bodyq.symbol.replace(/\.P$/, '')
    }
    const bodyStopLoss = checkStopLossBody(body)

    return bodyStopLoss
  } else {
    let body = {
      ...bodyq,
      symbol: bodyq.symbol.replace(/\.P$/, '')
    }

    return body
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
