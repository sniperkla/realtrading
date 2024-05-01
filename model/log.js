const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Log = new Schema(
  {
    symbol: { type: String },
    side: { type: String },
    status: { type: String },
    price: { type: String },
    takeProfit: { type: Object },
    time: { type: Date, default: Date.now },
    binanceTakeProfit1: { type: Object },
    binanceTakeProfit2: { type: Object },
    binanceTakeProfit3: { type: Object },
    binanceTakeProfit4: { type: Object },
    binanceMarket: { type: Object },
    binanceStopLoss: { type: Object }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Log', Log)
