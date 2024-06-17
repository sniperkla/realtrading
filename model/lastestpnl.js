const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Pnl = new Schema(
  {
    symbol: { type: String },
    unrealizePnL: { type: Number, default: 0 },
    time: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Pnl', Pnl)
