require('dotenv').config()
const lineNotifyPost = require('./lineNotifyPost')
const combine = require('./combineUser')

const Smcp = require('../model/smcp')
const Pearson = require('../model/pearsons')
const Martinglale = require('../model/martinglale')
const InitMargin = require('../model/initmarginmonthly')

const Log = require('../model/log')
const apiBinance = require('./apibinance')
const { scmpSellALL } = require('./sellAll')
const margin = process.env.MARGIN
const realEnvironment = require('./realEnv')
const callLeverage = require('./calLeverage')
const { calculateMartingale } = require('./matingaleEMA')
const storesl = require('../model/storesl')
const setting = require('../model/setting')
const filterSymbol = require('../model/filterSymbol')
const get = combine.combineUser()

const payload = require('./payload')
const checkEvery1hr = require('./checkEvery1hr')

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
  } else {
    console.log('have market already')
  }
}

const resetMartingale = async (symbol) => {
  const setMar = await Martinglale.findOneAndUpdate(
    { symbol: symbol },
    { $set: { previousMargin: margin, stackLose: 1 } },
    { upsert: true }
  )

  const buyit = {
    text: 'initsmcp',
    msg: `↪️ รีเซท Martingale to ค่าเริ่มต้น​ (${margin}) สำเร็จ ${symbol}\n                     ByOwner ↩️`
  }
  await lineNotifyPost.postLineNotify(buyit)
}

const filterSym = async (symbol, status) => {
  const checkFilterSymbol = await filterSymbol.findOne({ symbol: symbol })
  if (checkFilterSymbol) {
    await filterSymbol.findOneAndUpdate(
      { symbol: symbol },
      { status: status },
      { upsert: true }
    )
    const buyit = {
      text: 'debug',
      msg: `↪️ อัพเดท ${
        status === 'true' ? 'เปิดการใช้งาน' : 'ปิดการใช้งาน'
      } เหรียญ ${symbol} สำเร็จ \n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  } else {
    await filterSymbol.create({ symbol: symbol, status: status })
    const buyit = {
      text: 'debug',
      msg: `↪️ อัพเดท ${
        status === 'true' ? 'เปิดการใช้งาน' : 'ปิดการใช้งาน'
      } เหรียญ ${symbol} สำเร็จ \n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}

const showAllFilterSym = async () => {
  const checkFilterSymbol = await filterSymbol.find()

  const data = checkFilterSymbol.map((item) => {
    return { symbol: item.symbol, status: item.status }
  })

  data.forEach(async (item) => {
    const buyit = {
      text: 'debug',
      msg: `เหรียญ ${item.symbol}\n ${
        item.status === true ? '✅ เปิดการใช้งาน' : '❌ ปิดการใช้งาน'
      }`
    }
    await lineNotifyPost.postLineNotify(buyit)
  })
}

const resetMartingaleWithValue = async (symbol, value) => {
  const setMar = await Martinglale.findOneAndUpdate(
    { symbol: symbol },
    { previousMargin: value },
    { upsert: true }
  )
  const buyit = {
    text: 'initsmcp',
    msg: `↪️ รีเซท Martingale to ${value} สำเร็จ ${symbol}\n                     ByOwner ↩️`
  }
  await lineNotifyPost.postLineNotify(buyit)
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
      sideMarket?.binanceTakeProfit?.clientOrderId,
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
      sideMarket?.binanceStopLoss.clientOrderId,
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

const mockStopLoss = async (symbol, slBuy, slSell) => {
  const checkStopLoss = await storesl.findOne({ symbol: symbol })
  let buyit = {}
  if (!checkStopLoss) {
    await storesl.create({
      symbol: symbol,
      stopPriceCalBuy: slBuy,
      stopPriceCalSell: slSell
    })
    buyit = {
      text: 'initsmcp',
      msg: `↪️ Mock StopLoss สำเร็จ ${symbol}\n                     ByOwner ↩️`
    }
  } else {
    buyit = {
      text: 'initsmcp',
      msg: `↪❌ มี StopLoss ของ ${symbol} อยู่แล้ว`
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
    const data = await Log.findOne({ symbol: checkLog[i]?.symbol })
    await scmpSellALL(checkLog[i]?.symbol, get.API_KEY[0], get.SECRET_KEY[0])
    await calculateMartingale(
      checkLog[i]?.symbol,
      data,
      get.API_KEY[0],
      get.SECRET_KEY[0],
      'bot'
    )
  }
}
const setMarginStart = async (value) => {
  const checkInitMargin = await InitMargin.findOne({ _id: 'initmarginPort' })
  if (checkInitMargin) {
    await InitMargin.findOneAndUpdate(
      { _id: 'initmarginPort' },
      { value: value },
      { upsert: true }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า Margin เริ่มต้น สำเร็จ : ${value} \n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}
const setMarginStartMonth = async (value) => {
  const checkInitMargin = await InitMargin.findOne({ _id: 'initmargin' })
  if (checkInitMargin) {
    await InitMargin.findOneAndUpdate(
      { _id: 'initmargin' },
      { value: value },
      { upsert: true }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า Margin เริ่มเดือนใหม่ สำเร็จ : ${value} \n                     ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}
const resetMartingaleAll = async (margin) => {
  await Martinglale.updateMany({}, { previousMargin: margin })
  const msg = {
    text: 'initsmcp',
    msg: `↪️ รีเซท Martingale ทั้งหมด สำเร็จ : ${margin} \n                     ByOwner ↩️`
  }
  await lineNotifyPost.postLineNotify(msg)
}

const closeMarketWithArg = async (symbolList) => {
  for (let i = 0; i < symbolList.length; i++) {
    const data = await Log.findOne({ symbol: symbolList[i] })
    await scmpSellALL(symbolList[i], get.API_KEY[0], get.SECRET_KEY[0])
    await calculateMartingale(
      symbolList[i],
      data,
      get.API_KEY[0],
      get.SECRET_KEY[0],
      'bot'
    )
  }
}

const sellAllWhenToggle = async (value) => {
  try {
    const checkAnotherSettings = await setting?.find()
    const checkAnotherSetting = checkAnotherSettings.filter((item) => {
      return item._id !== 'sellAll_when_toggle'
    })
    const checkSetting = await setting?.findOne({
      _id: 'sellAll_when_toggle'
    })
    for (let i = 0; i < checkAnotherSetting.length; i++) {
      if (checkAnotherSetting[i]?.status === true) {
        const check = await setting.findOneAndUpdate(
          { _id: checkAnotherSetting[i]._id },
          { status: false }
        )
        if (check) {
          const msg2 = {
            text: 'initsmcp',
            msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
          }
          await lineNotifyPost.postLineNotify(msg2)
        }
      }
    }
    if (checkSetting) {
      await setting.findOneAndUpdate(
        { _id: 'sellAll_when_toggle' },
        { value: value, status: true }
      )
    }
    if (!checkSetting) {
      await setting.create({
        _id: 'sellAll_when_toggle',
        value: value,
        status: true
      })
    }
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เมื่อ unPNL เมื่อถึง :${value} สั่งขายทั้งหมด สำเร็จ สถานะ : '✅' ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error from botcommand : ', error)
  }
}

const settingStatusWhenToggle = async (status) => {
  const checkSetting = await setting.findOne({ _id: 'sellAll_when_toggle' })
  const checkAnotherSettings = await setting?.find()
  const checkAnotherSetting = checkAnotherSettings.filter((item) => {
    return item._id !== 'sellAll_when_toggle'
  })
  for (let i = 0; i < checkAnotherSetting.length; i++) {
    if (checkAnotherSetting[i].status === true && checkSetting) {
      const check = await setting?.findOneAndUpdate(
        { _id: checkAnotherSetting[i]?._id },
        { status: false }
      )
      if (check) {
        const msg2 = {
          text: 'initsmcp',
          msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
        }
        await lineNotifyPost.postLineNotify(msg2)
      }
    }
  }
  if (checkSetting) {
    await setting?.findOneAndUpdate(
      { _id: 'sellAll_when_toggle' },
      { status: status === 'active' ? true : false }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เงื่อนไขเมื่อ unPNL ถึง : ${
        checkSetting?.value
      } สั่งขายทั้งหมด สถานะ : ${status === 'active' ? '✅' : '❌'}  ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
  if (!checkSetting) {
    const msg = {
      text: 'initsmcp',
      msg: `⚠️ ไม่พบการตั้งค่า เงื่อนไขเมื่อถึง unPNL ที่กำหนด ⚠️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}

const sellAllWhenToggle2Level = async (start, end) => {
  try {
    const checkAnotherSettings = await setting?.find()
    const checkAnotherSetting = checkAnotherSettings.filter((item) => {
      return item._id !== 'sellAll_when_toggle_2Level'
    })
    const checkSetting = await setting?.findOne({
      _id: 'sellAll_when_toggle_2Level'
    })
    for (let i = 0; i < checkAnotherSetting.length; i++) {
      if (checkAnotherSetting[i]?.status === true) {
        const check = await setting.findOneAndUpdate(
          { _id: checkAnotherSetting[i]._id },
          { status: false }
        )
        if (check) {
          const msg2 = {
            text: 'initsmcp',
            msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
          }
          await lineNotifyPost.postLineNotify(msg2)
        }
      }
    }
    if (checkSetting) {
      await setting.findOneAndUpdate(
        { _id: 'sellAll_when_toggle_2Level' },
        { start: start, end: end, status: true, executed: false }
      )
    }
    if (!checkSetting) {
      await setting.create({
        _id: 'sellAll_when_toggle_2Level',
        start: start,
        end: end,
        status: true,
        executed: false
      })
    }
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เมื่อ unPNL ถึง ${start} เมื่อแตะ ${end} สั่งขายทั้งหมด สำเร็จ สถานะ : ✅ ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error from botcommand : ', error)
  }
}

const settingStatusWhenToggle2Level = async (status) => {
  const checkSetting = await setting?.findOne({
    _id: 'sellAll_when_toggle_2Level'
  })
  const checkAnotherSettings = await setting?.find()
  const checkAnotherSetting = checkAnotherSettings.filter((item) => {
    return item._id !== 'sellAll_when_toggle_2Level'
  })
  for (let i = 0; i < checkAnotherSetting.length; i++) {
    if (checkAnotherSetting[i].status === true && checkSetting) {
      const check = await setting?.findOneAndUpdate(
        { _id: checkAnotherSetting[i]._id },
        { status: false }
      )
      if (check) {
        const msg2 = {
          text: 'initsmcp',
          msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
        }
        await lineNotifyPost.postLineNotify(msg2)
      }
    }
  }

  if (checkSetting) {
    await setting.findOneAndUpdate(
      { _id: 'sellAll_when_toggle_2Level' },
      { status: status === 'active' ? true : false }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เงื่อนไขเมื่อ unPNL ถึง : ${
        checkSetting?.start
      } เมื่อแตะ ${checkSetting?.end} สถานะ : ${
        status === 'active' ? '✅' : '❌'
      }  ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
  if (!checkSetting) {
    const msg = {
      text: 'initsmcp',
      msg: `⚠️ ไม่พบการตั้งค่า เงื่อนไขเมื่อถึง unPNL ที่กำหนด ⚠️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}

const sellAllWhenToggleMbalance = async (value) => {
  try {
    const checkAnotherSettings = await setting?.find()
    const checkAnotherSetting = checkAnotherSettings.filter((item) => {
      return item._id !== 'sellAll_when_toggle_Mbalnce'
    })
    const checkSetting = await setting?.findOne({
      _id: 'sellAll_when_toggle_Mbalnce'
    })

    for (let i = 0; i < checkAnotherSetting.length; i++) {
      if (checkAnotherSetting[i]?.status === true) {
        const check = await setting.findOneAndUpdate(
          { _id: checkAnotherSetting[i]._id },
          { status: false }
        )
        if (check) {
          const msg2 = {
            text: 'initsmcp',
            msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
          }
          await lineNotifyPost.postLineNotify(msg2)
        }
      }
    }
    if (checkSetting) {
      await setting.findOneAndUpdate(
        { _id: 'sellAll_when_toggle_Mbalnce' },
        { value: value, status: true, executed: false }
      )
    }
    if (!checkSetting) {
      await setting.create({
        _id: 'sellAll_when_toggle_Mbalnce',
        value: value,
        status: true,
        executed: false
      })
    }
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เมื่อ MarginBalance ถึง : ${value} สั่งขายทั้งหมด สำเร็จ สถานะ : ✅ ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error from botcommand : ', error)
  }
}

const settingStatusWhenMbalance = async (status) => {
  const checkSetting = await setting?.findOne({
    _id: 'sellAll_when_toggle_Mbalnce'
  })
  const checkAnotherSettings = await setting?.find()
  const checkAnotherSetting = checkAnotherSettings.filter((item) => {
    return item._id !== 'sellAll_when_toggle_Mbalnce'
  })
  for (let i = 0; i < checkAnotherSetting.length; i++) {
    if (checkAnotherSetting[i].status === true && checkSetting) {
      const check = await setting?.findOneAndUpdate(
        { _id: checkAnotherSetting[i]._id },
        { status: false }
      )
      if (check) {
        const msg2 = {
          text: 'initsmcp',
          msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
        }
        await lineNotifyPost.postLineNotify(msg2)
      }
    }
  }
  if (checkSetting) {
    await setting.findOneAndUpdate(
      { _id: 'sellAll_when_toggle_Mbalnce' },
      { status: status === 'active' ? true : false }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เงื่อนไขเมื่อ MarginBalance ถึง : ${
        checkSetting?.start
      } เมื่อแตะ ${checkSetting?.end} สถานะ : ${
        status === 'active' ? '✅' : '❌'
      }  ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
  if (!checkSetting) {
    const msg = {
      text: 'initsmcp',
      msg: `⚠️ ไม่พบการตั้งค่า เงื่อนไขเมื่อถึง MarginBalance ที่กำหนด ⚠️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}

const sellAllWhenToggleMbalance2Level = async (start, end) => {
  try {
    const checkAnotherSettings = await setting?.find()
    const checkAnotherSetting = checkAnotherSettings.filter((item) => {
      return item._id !== 'sellAll_when_toggle_Mbalnce2Level'
    })
    const checkSetting = await setting?.findOne({
      _id: 'sellAll_when_toggle_Mbalnce2Level'
    })

    for (let i = 0; i < checkAnotherSetting.length; i++) {
      if (checkAnotherSetting[i]?.status === true) {
        const check = await setting.findOneAndUpdate(
          { _id: checkAnotherSetting[i]._id },
          { status: false }
        )
        if (check) {
          const msg2 = {
            text: 'initsmcp',
            msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
          }
          await lineNotifyPost.postLineNotify(msg2)
        }
      }
    }
    if (checkSetting) {
      await setting.findOneAndUpdate(
        { _id: 'sellAll_when_toggle_Mbalnce2Level' },
        { start: start, end: end, status: true, executed: false }
      )
    }
    if (!checkSetting) {
      await setting.create({
        _id: 'sellAll_when_toggle_Mbalnce2Level',
        start: start,
        end: end,
        status: true,
        executed: false
      })
    }
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เมื่อ MarginBalance start: ${start} สั่งขายทั้งหมดเมื่อ end:${end}  สำเร็จ สถานะ : ✅ ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error from botcommand : ', error)
  }
}

const settingStatusWhenMbalance2Level = async (status) => {
  const checkSetting = await setting?.findOne({
    _id: 'sellAll_when_toggle_Mbalnce2Level'
  })
  const checkAnotherSettings = await setting?.find()
  const checkAnotherSetting = checkAnotherSettings.filter((item) => {
    return item._id !== 'sellAll_when_toggle_Mbalnce2Level'
  })
  for (let i = 0; i < checkAnotherSetting.length; i++) {
    if (checkAnotherSetting[i].status === true && checkSetting) {
      const check = await setting?.findOneAndUpdate(
        { _id: checkAnotherSetting[i]._id },
        { status: false }
      )
      if (check) {
        const msg2 = {
          text: 'initsmcp',
          msg: `↪️ ปิดการใช้งาน ฟังก์ชั่น ${checkAnotherSetting[i]?._id} อัตโนมัติ `
        }
        await lineNotifyPost.postLineNotify(msg2)
      }
    }
  }
  if (checkSetting) {
    await setting.findOneAndUpdate(
      { _id: 'sellAll_when_toggle_Mbalnce2Level' },
      { status: status === 'active' ? true : false }
    )
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า เงื่อนไขเมื่อ MarginBalance ถึง : ${
        checkSetting?.start
      } เมื่อแตะ ${checkSetting?.end} สั่งขายทั้งหมด สถานะ : ${
        status === 'active' ? '✅' : '❌'
      }  ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
  if (!checkSetting) {
    const msg = {
      text: 'initsmcp',
      msg: `⚠️ ไม่พบการตั้งค่า เงื่อนไขเมื่อถึง MarginBalance2Level ที่กำหนด ⚠️`
    }
    await lineNotifyPost.postLineNotify(msg)
  }
}

const filterAllSym = async (status) => {
  try {
    await filterSymbol.updateMany({}, { status: status })
    const msg = {
      text: 'initsmcp',
      msg: `↪️ ตั้งค่า กรองเหรียญ สำเร็จ สถานะ ${status} ${
        status === 'true' ? '✅ เปิดใช้งาน ทั้งหมด' : '❌ ปิดใช้งาน ทั้งหมด'
      } ByOwner ↩️`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error', error)
  }
}
const showSetting = async () => {
  try {
    const all = await setting.find()
    const data = all.map((item, index) => {
      return `${index + 1}. Name : ${item._id}\n ${
        item?._id === 'sellAll_when_toggle_2Level' ||
        item?._id === 'sellAll_when_toggle_Mbalnce2Level'
          ? `เริ่มต้นตอน :${item?.start} ขายตอน :${item.end}\n         ${
              item?.executed === true && item.status === true
                ? `สถานะการทำงาน :  🟢 เริ่มแล้ว จะถูกขายทั้งหมดเมื่อ : ${item?.end} \n 🔴 ยังไม่ถึงจุดเริ่มทำงาน: ${item?.start}`
                : ``
            }`
          : `ขายทั้งหมดเมื่อถึง ${item?.value}\n`
      }\nสถานะ เปิด/ปิด : ${
        item?.status === true ? '✅ เปิดการใช้อยู่' : '❌ ปิดการใช้งาน'
      }\n __________________________\n\n`
    })
    const msg = {
      text: 'initsmcp',
      msg: `🚧 All Setting 🚧 \n\n${data}`
    }
    await lineNotifyPost.postLineNotify(msg)
  } catch (error) {
    console.log('error', error)
  }
}
const showAll = async () => {
  try {
    const message = await payload.payloadPnl()
    const payloadPnl = {
      text: 'PAYLOADPNL',
      msg: `🔥 ${message} 🔥`
    }
    await lineNotifyPost.postLineNotify(payloadPnl)
    await checkEvery1hr.checkSumMatingale()
    await checkEvery1hr.checkSideMartingale()
    await checkEvery1hr.checkSumMatingaleOpened()
  } catch (error) {
    console.log('error', error)
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
  closeAllMarket,
  mockStopLoss,
  filterSym,
  showAllFilterSym,
  setMarginStart,
  setMarginStartMonth,
  resetMartingaleAll,
  closeMarketWithArg,
  sellAllWhenToggle,
  settingStatusWhenToggle,
  filterAllSym,
  sellAllWhenToggle2Level,
  settingStatusWhenToggle2Level,
  settingStatusWhenMbalance,
  sellAllWhenToggleMbalance,
  settingStatusWhenMbalance2Level,
  sellAllWhenToggleMbalance2Level,
  showSetting,
  showAll
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
  const checkStoreSL = await storesl.findOne({
    symbol: body.symbol
  })

  if (checkMarketFirst === null) {
    const calLeverage = await callLeverage.leverageCal(
      body.symbol,
      body.priceCal,
      body.side === 'SELL'
        ? checkStoreSL?.stopPriceCalSell
        : checkStoreSL?.stopPriceCalBuy,
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
