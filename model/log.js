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
    binanceTakeProfitCp: { type: Object },
    binanceTakeProfit1: { type: Object },
    binanceTakeProfit2: { type: Object },
    binanceTakeProfit3: { type: Object },
    binanceTakeProfit4: { type: Object },
    binanceTakeProfit5: { type: Object },
    binanceTakeProfit6: { type: Object },
    binanceTakeProfit7: { type: Object },
    binanceMarket: { type: Object },
    binanceStopLoss: { type: Object },
    takeProfitZone: { type: Object },
    lockStopLoss: {
      type: Object,
      default: {
        lock: false,
        zone1: false,
        zone2: false,
        zone3: false,
        zone4: false,
        zone5: false,
        zone6: false,
        zone7: false
      }
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Log', Log)
