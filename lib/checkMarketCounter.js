const axios = require('axios')
const limitMarkets = require('../model/counter')

const incCounter = async () => {
  const check = await limitMarkets.findOne({ _id: 'counterMarket' })
  if (!check) {
    await limitMarkets.create({ _id: 'counterMarket', counter: 0 })
  }
  const update = await limitMarkets.findOneAndUpdate({
    $inc: { counter: 1 }
  })

  return update.counter
}

const deleteCounter = async () => {
  await limitMarkets.findOneAndUpdate({
    $inc: { counter: -1 }
  })
}
module.exports = { incCounter, deleteCounter }
