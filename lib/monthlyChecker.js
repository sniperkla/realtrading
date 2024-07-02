const LogwinRate = require('../model/logwinrate')
const MartingaleLog = require('../model/matingalelog')

const checkMonthlyAction = async () => {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // Add 1 for 1-based indexing
  const firstDayOfMonth = new Date(today.getFullYear(), currentMonth - 1, 1)
  const lastDayOfMonth = new Date(today.getFullYear(), currentMonth, 0) // Set to the last day (0-indexed)

  const winRateMonthly = await LogwinRate.find({
    createdAt: {
      $gte: firstDayOfMonth,
      $lt: new Date(today.getFullYear(), currentMonth, 1) // Use first day of next month for clarity
    }
  })

  const winCount = winRateMonthly.filter((item) => item.status === 'win').length

  console.log('wincount', winCount)

  const loseCount = winRateMonthly.filter(
    (item) => item.status === 'lose'
  ).length
  console.log('lose count', loseCount)

  const final = { win: winCount, lose: loseCount }

  console.log('final', final)
  return final
}

const checkMonthlyActionMartingale = async () => {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // Add 1 for 1-based indexing
  const firstDayOfMonth = new Date(today.getFullYear(), currentMonth - 1, 1)
  const lastDayOfMonth = new Date(today.getFullYear(), currentMonth, 0) // Set to the last day (0-indexed)

  const MartingaleLogs = await MartingaleLog.find({
    createdAt: {
      $gte: firstDayOfMonth, // Greater than or equal to the first day of the month
      $lt: lastDayOfMonth.setDate(lastDayOfMonth.getDate() + 1) // Less than the first day of the next month
    }
  })
  const highest = Math.max(...MartingaleLogs.map((item) => item.martingale))

  const HighestMartingale = MartingaleLogs.filter(
    (item) => item.martingale === highest
  )
  const final = HighestMartingale[0].martingale
  return final
}

const checkActionMartingaleOverall = async () => {
  const MartingaleLogs = await MartingaleLog.find()
  const highest = Math.max(...MartingaleLogs.map((item) => item.martingale))

  const HighestMartingale = MartingaleLogs.filter(
    (item) => item.martingale === highest
  )
  const final = HighestMartingale[0].martingale

  return final
}

module.exports = {
  checkMonthlyAction,
  checkMonthlyActionMartingale,
  checkActionMartingaleOverall
}
