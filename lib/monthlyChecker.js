const LogwinRate = require('../model/logwinrate')

const checkMonthlyAction = async () => {
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // Add 1 for 1-based indexing
  const firstDayOfMonth = new Date(today.getFullYear(), currentMonth - 1, 1)
  const lastDayOfMonth = new Date(today.getFullYear(), currentMonth, 0) // Set to the last day (0-indexed)

  const winRateMonthly = await LogwinRate.find({
    createdAt: {
      $gte: firstDayOfMonth, // Greater than or equal to the first day of the month
      $lt: lastDayOfMonth.setDate(lastDayOfMonth.getDate() + 1) // Less than the first day of the next month
    }
  })

  const winCount = await winRateMonthly
    .filter((item) => item.status === 'win')
    .count()

  const loseCount = await winRateMonthly
    .filter((item) => item.status === 'lose')
    .count()

  const final = { win: winCount, lose: loseCount }

  return final
}

module.exports = { checkMonthlyAction }
