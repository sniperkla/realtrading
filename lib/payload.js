require('dotenv').config()
const apiBinance = require('../lib/apibinance')

const Lastestpnl = require('../model/unpnl')
const Winrate = require('../model/winrate')

const monthlyCheck = require('../lib/monthlyChecker')
const InitMarginMonthly = require('../model/initmarginmonthly')

const payloadPnl = async (symbol) => {
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY
  const initMarginMonthly = await InitMarginMonthly.findOne({
    _id: 'initmargin'
  })
  const marginStartday = await InitMarginMonthly.findOne({
    _id: 'marginstartday'
  })
  const getAccountInfo = await apiBinance.getAccountInfo(apiKey, secretKey)
  const unPNL = getAccountInfo?.totalUnrealizedProfit || 'error'
  const walletBalance = getAccountInfo?.totalWalletBalance || 'error'
  const margin = getAccountInfo?.totalMarginBalance || 'error'

  const pnl =
    (walletBalance - initMarginMonthly.value / initMarginMonthly.value) * 100
  const lastestPnl = await Lastestpnl.findOne({ symbol: symbol })

  const winrate = await Winrate.find()
  const sumCountWinRate = winrate[0]?.win + winrate[0]?.lose || 0

  const percentWin = (winrate[0]?.win / sumCountWinRate) * 100 || 0
  const percentLoss = (winrate[0]?.lose / sumCountWinRate) * 100 || 0

  const winrateMonthly = await monthlyCheck.checkMonthlyAction()

  const sumCountWinRateMonthly = winrateMonthly.win + winrateMonthly.lose

  const percentWinMonthly = (winrateMonthly?.win / sumCountWinRateMonthly) * 100
  const percentLoseMonthly =
    (winrateMonthly?.lose / sumCountWinRateMonthly) * 100

  const martingale = await monthlyCheck.checkActionMartingaleOverall()
  const martingaleMonthly = await monthlyCheck.checkMonthlyActionMartingale()

  const daily = marginStartday?.margin

  const forMaxDrawDown = await InitMarginMonthly.findOne({
    _id: 'marginstartday'
  })
  const maxDrawDown = forMaxDrawDown?.highest || 0

  const cumulativePnl =
    ((initMarginMonthly.value * unPNL) / initMarginMonthly.value) * 100

  const message = `\nMargin Balance : ${margin}\n                     Wallet Balance : ${walletBalance}\n                     Unrealized PNL : ${unPNL}\n                     PNL : ${
    lastestPnl?.unrealizePnL || 'error'
  }\n                     Cumulative PNL : ${
    cumulativePnl.toFixed(4) || 'error'
  }\n                     Winrate All : ${
    winrate[0]?.win || 0
  } || ${percentWin}%\n                     LossRate All : ${
    winrate[0]?.lose || 0
  } || ${percentLoss}%\n                     Winrate Monthly : ${
    winrateMonthly?.win || 0
  } || ${percentWinMonthly.toFixed(
    4
  )}%\n                     LossRate Monthy : ${
    winrateMonthly?.lose || 0
  } || ${percentLoseMonthly.toFixed(
    4
  )}%\n                     Daily Profit/Drawdown : ${
    daily.toFixed(4) || 'error'
  } || ${daily.toFixed(4) * 100}%\n                     Max Drawdown : ${
    maxDrawDown || 'error'
  } || ${maxDrawDown.toFixed(4) * 100 || 'error'}%`

  return message
}

module.exports = { payloadPnl }
