const express = require('express')
const HTTPStatus = require('http-status')
const app = express()
const port = 3070
const cors = require('cors')
const bodyParser = require('body-parser')
const Trading = require('./model/trading')
const Log = require('./model/log')
const Bos = require('./model/bos')
const Fixdec = require('./model/fixdec')

const lineNotifyPost = require('./lib/lineNotifyPost')
const apiBinance = require('./lib/apibinance')
const callLeverage = require('./lib/calLeverage')
const realEnvironment = require('./lib/realEnv')
const combine = require('./lib/combineUser')
const cron = require('node-cron')
const cronJub = require('./lib/cronJob')
const linebot = require('./lib/linebot')
const lvcheck = require('./lib/levelChecker')
const checkBos = require('./lib/checkBos')

require('dotenv').config()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const mongoose = require('mongoose')
const Martinglale = require('./model/martinglale')

const pathName = process.env.NAME
const connectionString = `${process.env.DB}` + `${pathName}`
const margin = process.env.MARGIN
const get = combine.combineUser()

mongoose
  .connect(connectionString, {
    useNewUrlParser: true
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('Error connecting to MongoDB:', err))
let bodyq = null

app.post(`/sellall_${pathName}`, async (req, res) => {
  try {
    const body = req.body

    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {}
})

app.post(`/bot_${pathName}`, async (req, res) => {
  try {
    const body = req.body
    await linebot.messageReply(body)
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {}
})

app.get(`/getbinance_${pathName}`, async (req, res) => {
  try {
    const symbol = 'WIFUSDT'
    const fixdec = await Fixdec.findOne({ symbol: symbol })
    const buyit = {
      text: 'takeprofit',
      msg: `🟢 ตรวจสอบทศนิยม เหรียญ ${symbol} : ${
        fixdec.dec
      } ตำแหน่ง ราคาเข้า  ${parseFloat(priceCal.toFixed(fixdec.dec))}`
    }
    await lineNotifyPost.postLineNotify(buyit)

    co
    return res.status(HTTPStatus.OK).json({ success: true, data: Date.now() })
  } catch (error) {}
})

const scheduleForakeProfit4Step = '*/30 * * * * *'
const scheduleForcheckProfit = '*/20 * * * * *'
const scheduleForcheckBos1Min = '*/13 * * * * *'
const scheduleForStartDay = '0 0 * * *'
const schedule1hr = '0 * * * *'
const doCheckTakeProfit4Step = async () => {
  await cronJub.checkTakeProfit4Step(margin)
}

const doCheckBos1Min = async () => {
  await cronJub.checkBoss1min()
  await cronJub.checkOpenOrder4Bos()
}

const doCheckMargin = async () => {
  await cronJub.check50Percent(get.API_KEY[0], get.SECRET_KEY[0])
}
const doStartDay = async () => {
  const buyit = {
    text: 'initsmcp',
    msg: `💎 test every 24 hr`
  }
  await lineNotifyPost.postLineNotify(buyit)
  await cronJub.everyStartDay(get.API_KEY[0], get.SECRET_KEY[0])
}
const doStart1hrPayload = async () => {
  await cronJub.every1hrPayload()
}

const task1 = cron.schedule(scheduleForakeProfit4Step, doCheckTakeProfit4Step)
const task2 = cron.schedule(scheduleForcheckProfit, doCheckMargin)
const task3 = cron.schedule(scheduleForStartDay, doStartDay)
const task4 = cron.schedule(schedule1hr, doStart1hrPayload)
const task5 = cron.schedule(scheduleForcheckBos1Min, doCheckBos1Min)

task1.start()
task2.start()
task3.start()
task4.start()
task5.start()

app.post(`/gettrading_${pathName}`, async (req, res) => {
  try {
    let bodyq = req.body
    let body = await checkDataFirst(bodyq)
    const symbol = bodyq.symbol.replace(/\.P$/, '')
    if (body.type === 'STOP_MARKET' && bodyq?.version === 'v3.1') {
      await checkStopLoss(body)
    }
    if (bodyq?.takeProfit || bodyq?.stopPriceCal || bodyq?.priceCal) {
      if (!bodyq?.version) {
        if (bodyq?.priceCal) {
          const previous = await Bos.findOne({ symbol: symbol })
          previous?.priceCal?.value &&
            (await Bos.findOneAndUpdate(
              { symbol: symbol },
              {
                changePriceCal:
                  bodyq?.priceCal === previous?.priceCal?.value.toString()
                    ? false
                    : true
              },
              {
                upsert: true
              }
            ))
        }
        //check current priceCal
        setTimeout(async () => {
          // wait for bos na jaa
          bodyq?.takeProfit
            ? await Bos.findOneAndUpdate(
                { symbol: symbol },
                {
                  takeProfit: { value: bodyq?.takeProfit, date: Date.now() }
                },
                { upsert: true }
              )
            : bodyq?.stopPriceCal
            ? await Bos.findOneAndUpdate(
                { symbol: symbol },
                {
                  stopPriceCal: {
                    value: bodyq?.stopPriceCal,
                    date: Date.now()
                  }
                },
                { upsert: true }
              )
            : bodyq?.priceCal &&
              (await Bos.findOneAndUpdate(
                { symbol: symbol },
                {
                  priceCal: { value: bodyq?.priceCal, date: Date.now() }
                },
                {
                  upsert: true
                }
              ))
        }, 10000)
      }
    }
    if (bodyq?.BOS) {
      const checkBoss = await Bos.findOne({ symbol: symbol })
      if (!checkBoss) {
        await Bos.create({
          symbol: symbol,
          side: bodyq.BOS,
          status: 'NEW',
          bosDate: Date.now()
        })
      } else {
        await Bos.findOneAndUpdate(
          {
            symbol: symbol
          },
          { side: bodyq.BOS, bosDate: Date.now() },
          { upsert: true }
        )
      }
      await checkBos.togleBos(symbol)
      //first check before buy
      // await cronJub.checkTakeProfit4Step(margin)
      const martingale = await Martinglale.findOne({ symbol: symbol })
      const data = await Log.findOne({ symbol: symbol })
      if (!martingale) {
        await Martinglale.create({
          symbol: symbol,
          stackLose: 1,
          previousMargin: margin
        })
      }

      if (!data) {
        const buyit = {
          symbol: symbol,
          text: 'initpearson',
          msg: `💎เข้าเงื่อนไข BOS: ${symbol}\n           Market side : ${bodyq?.BOS} 💎`
        }
      }
    }

    const buyit = {
      text: 'debug',
      msg: `${JSON.stringify(bodyq)}`
    }
    await lineNotifyPost.postLineNotify(buyit)
    return res.status(HTTPStatus.OK).json({ success: true, data: 'ok' })
  } catch (error) {}
})

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
    }
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
      symbol: symbol,
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
        const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
        const margin = getAccountInfo?.totalMarginBalance || 'error'
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

  if (body.side === 'BUY')
    real = {
      type: body.type,
      version: body.version,
      BTU: body.BTU,
      side: body.side,
      symbol: body.symbol,
      priceCal: parseFloat(body.priceCal),
      stopPriceCal: parseFloat(body.stopPriceCal2)
    }
  else if (body.side === 'SELL') {
    real = {
      type: body.type,
      version: body.version,
      BTL: body.BTL,
      side: body.side,
      symbol: body.symbol,
      priceCal: parseFloat(body.priceCal),
      stopPriceCal: parseFloat(body.stopPriceCal2)
    }
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
