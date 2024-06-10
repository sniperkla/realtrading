const axios = require('axios')
require('dotenv').config()

const postLineNotify = async (buyit, type, status) => {
  const url = 'https://notify-api.line.me/api/notify'

  const accessToken = process.env.LINE_NOTIFY
  let message = null

  if (buyit.text === 'buy') {
    message = whenBuy(buyit)
  } else if (buyit.text === 'updatestoploss') {
    message = whenUpdateStopLoss(buyit)
  } else if (buyit.text === 'stoplossfirst') {
    message = whenStopLossFirst(buyit)
  } else if (buyit.text === 'takeprofit') {
    message = whenTakeProfit(buyit)
  } else if (buyit.text === 'error') {
    message = whenError(buyit)
  } else if (buyit.text === 'checkstoploss') {
    message = whenCheckStopLoss(buyit)
  } else if (buyit.text === 'overTrade') {
    message = whenCheckOverTrade(buyit)
  } else if (buyit.text === 'filled') {
    message = whenOrderHasFilled(buyit)
  } else if (buyit.text === 'errorTryCacth') {
    message = whenOrderErrorTryCacth(buyit)
  } else if (buyit.text === 'reverse') {
    message = whenReverse(buyit)
  } else if (buyit.text === 'SMH') {
    message = whenSMH(buyit)
  } else if (buyit.text === 'SMCP') {
    message = whenSMCP(buyit)
  } else if (buyit.text === 'pearson') {
    message = whenPearson(buyit)
  } else if (buyit.text === 'SMCPCHECK') {
    message = whenCheckSMCP(buyit)
  } else if (buyit.text === 'donotbuying') {
    message = whenDonotBuying(buyit)
  } else if (buyit.text === 'initpearson') {
    message = whenInitPearson(buyit)
  } else if (buyit.text === 'initsmcp') {
    message = whenInitSMCP(buyit)
  } else if (buyit.text === 'debug') {
    whenDebug(buyit)
  } else {
    message = whenMarketTrigger(buyit)
  }

  await axios({
    method: 'post',
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {
      message: message
      // Other parameters as needed (refer to LINE Notify API documentation)
    }
  })
    .then(() => {})

    .catch((error) => {
      console.log(error)
    })
}
module.exports = {
  postLineNotify
}

const whenBuy = (buyit) => {
  message = `\n--------------\n${buyit.text2}\n--------------\nชื่อเหรียญ: ${
    buyit.symbol
  }\nจำนวน: ${buyit.quantity}\nSide order : ${buyit.side}\nleverage: ${
    buyit.leverage
  }\nMark Price Future : ${
    buyit.valueAskBid
  } \nMark Price Future (คำนวณแล้ว) : ${buyit.price}\nbids: ${
    buyit.bids
  }\nasks: ${buyit.asks}\nงบลงทุน: ${buyit.budget}\nซื้อเหรียญขั้นต่ำ: ${
    buyit.minimum
  }\nPosition Open: ${buyit.openLongShort}\nSL%: ${buyit.st}% , ${
    buyit.stopPriceCal
  }\nTP: ${buyit.takeProfit}\nเงินคงเหลือ: ${
    buyit.defaultMargin
  }\n\nแบบมี\nLP เริ่ม :${buyit.lpStart}\nLP จบ :${buyit.lpEnd}\nLPS-LPE  :${
    buyit.lpStart - buyit.lpEnd
  }\nMargin เริ่ม :${buyit.marginStart}\nMargin จบ :${
    buyit.marginEnd
  }\nqty เริ่ม :${buyit.qtyStart}\nqty จบ :${buyit.qtyEnd}${
    buyit.lpEnd2 !== 0 && buyit.marginEnd2 !== 0 && buyit.qtyEnd2 !== 0
      ? `\n\nแบบไม่มี\nLP เริ่ม :${buyit.lpStart}\nLP จบ :${
          buyit.lpEnd2
        }\nLPS-LPE  :${buyit.lpStart - buyit.lpEnd2}\nMargin เริ่ม :${
          buyit.marginStart
        }\nMargin จบ :${buyit.marginEnd2}\nqty เริ่ม :${
          buyit.qtyStart
        }\nqty จบ :${buyit.qtyEnd2}`
      : ''
  }  `
  postLineDebug(message)
  return message
}

const whenError = (buyit) => {
  message = `\nยกเลิกคำสั่งซื้อ เหรียญ: ${buyit.symbol}\nError from ${buyit.type} : ${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenUpdateStopLoss = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}
const whenStopLossFirst = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}
const whenOrderHasFilled = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenMarketTrigger = (buyit) => {
  if (buyit.type === 'MARKET') {
    message = `\n--------------\nMARKET\n--------------\nsymbol: ${buyit.symbol}\ntype: ${buyit.type}\nside: ${buyit.side}\ntime: ${buyit.time}\n***********\nTakeProfit\n***********\ntype: ${buyit.takeProfit.type}\nside: ${buyit.takeProfit.side}\nsymbol: ${buyit.takeProfit.symbol}\ntakeprofit: ${buyit.takeProfit.takeprofit}`
  } else if (buyit.type === 'STOP_MARKET')
    message = `\n--------------\nSTOPLOSS\n--------------\nsymbol: ${buyit.symbol}\ntype: ${buyit.type}\nside: ${buyit.side}\nstopPrice: ${buyit.stopPrice}\ntime: ${buyit.time}`
  postLineDebug(message)

  return message
}
const whenTakeProfit = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenCheckStopLoss = (buyit) => {
  message = `เหรียญ ${buyit.symbol} ${buyit.msg}`
  postLineDebug(message)

  return message
}
const whenCheckOverTrade = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenOrderErrorTryCacth = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenDebug = async (buyit) => {
  message = ` ${buyit.msg}`
  await postLineDebug(message)
}
const whenReverse = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}
const whenSMH = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}
const whenSMCP = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)

  return message
}

const whenPearson = (buyit) => {
  message = `${buyit.msg}`
  // postLineDebug(message)
  return message
}
const whenCheckSMCP = (buyit) => {
  message = `${buyit.msg}`
  // postLineDebug(message)
  return message
}

const whenDonotBuying = (buyit) => {
  message = `${buyit.msg}`
  postLineDebug(message)
  return message
}

const whenInitPearson = (buyit) => {
  message = `${buyit.msg}`
  // postLineDebug(message)

  return message
}

const whenInitSMCP = (buyit) => {
  message = `${buyit.msg}`
  // postLineDebug(message)

  return message
}

const postLineDebug = async (message) => {
  const url = 'https://notify-api.line.me/api/notify'
  // const accessToken = '0yjEP1yAcKKUeIZ4elDCLeOrTA2lr7OBiBz16znQCnd' //test
  const accessToken = 'G3HQNuHUJt6PtWAf3xxtB5DBYlFDptHQZy0N3ZyUX4T'
  await axios({
    method: 'post',
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: {
      message: message
    }
  })
    .then(() => {})

    .catch((error) => {
      console.log(error)
    })
}
