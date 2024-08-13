const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LogBos = new Schema(
  {
    symbol: { type: String },
    side: { type: String },
    takeProfit: { type: String },
    stopPriceCal: { type: String },
    priceCal: { type: String },
    status: { type: String }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('LogBos', LogBos)
