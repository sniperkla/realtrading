require('dotenv').config()
const apiBinance = require('../lib/apibinance')

const Winrate = require('../model/winrate')

const monthlyCheck = require('../lib/monthlyChecker')
const InitMarginMonthly = require('../model/initmarginmonthly')

const payloadPnl = async () => {
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  const initMarginMonthly = await InitMarginMonthly.findOne({
    _id: 'initmargin'
  })
  const marginStartday = await InitMarginMonthly.findOne({
    _id: 'marginstartday'
  })

  const marginPort = await InitMarginMonthly.findOne({
    _id: 'initmarginPort'
  })
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
  const walletBalance = getAccountInfo?.totalWalletBalance || 'error'
  const margin = getAccountInfo?.totalMarginBalance || 'error'
  const availableBalance = getAccountInfo?.availableBalance

  const winrate = await Winrate.find()
  const sumCountWinRate = winrate[0]?.win + winrate[0]?.lose || 0

  const percentWin = (winrate[0]?.win / sumCountWinRate) * 100 || 0
  const percentLoss = (winrate[0]?.lose / sumCountWinRate) * 100 || 0

  const winrateMonthly = await monthlyCheck.checkMonthlyAction()

  const sumCountWinRateMonthly = winrateMonthly.win + winrateMonthly.lose

  const percentWinMonthly =
    (winrateMonthly?.win / sumCountWinRateMonthly) * 100 || 0
  const percentLoseMonthly =
    (winrateMonthly?.lose / sumCountWinRateMonthly) * 100 || 0

  const daily = marginStartday?.margin

  const forMaxDrawDown = await InitMarginMonthly.findOne({
    _id: 'marginstartday'
  })

  const maxDrawDown = forMaxDrawDown?.highest || 0
  const cumulativePnl =
    ((walletBalance - initMarginMonthly.value) / initMarginMonthly.value) * 100

  const allCumulativePnl =
    ((walletBalance - marginPort.value) / marginPort.value) * 100

  const message = `\n                     🚀 Margin Start (Port) :\n                     ${parseFloat(
    marginPort.value
  ).toFixed(
    4
  )}\n                     🚀 Margin Start (Month) :\n                     ${parseFloat(
    initMarginMonthly.value
  ).toFixed(
    4
  )}\n                     🚀 Margin Balance :\n                     ${parseFloat(
    margin
  ).toFixed(
    4
  )}\n                     🚀 Available Balance :\n                     ${parseFloat(
    availableBalance
  ).toFixed(
    4
  )}\n                     🚀 Wallet Balance :\n                     ${parseFloat(
    walletBalance
  ).toFixed(
    4
  )}\n                     🚀 Unrealized PNL :\n                     ${parseFloat(
    unPNL
  ).toFixed(
    4
  )}\n                     🚀 All Cumulative PNL :\n                     ${
    parseFloat(allCumulativePnl).toFixed(4) || 'error'
  }%\n                     🚀 Cumulative PNL :\n                     ${
    parseFloat(cumulativePnl).toFixed(4) || 'error'
  }%\n                     🚀 Winrate All :\n                     ${
    winrate[0]?.win || 0
  } || ${parseFloat(percentWin).toFixed(
    4
  )}%\n                     🚀 LossRate All :\n                     ${
    winrate[0]?.lose || 0
  } || ${parseFloat(percentLoss).toFixed(
    4
  )}%\n                     🚀 Winrate Monthly :\n                     ${
    winrateMonthly?.win || 0
  } || ${parseFloat(percentWinMonthly).toFixed(
    4
  )}%\n                     🚀 LossRate Monthy :\n                     ${
    winrateMonthly?.lose || 0
  } || ${parseFloat(percentLoseMonthly).toFixed(
    4
  )}%\n                     🚀 Daily/Drawdown :\n                     ${
    parseFloat(daily).toFixed(4) || 'error'
  }%\n                     🚀 Max Drawdown :\n                     ${
    parseFloat(maxDrawDown).toFixed(4) || 'error'
  }%`
  return message
}

module.exports = { payloadPnl }
