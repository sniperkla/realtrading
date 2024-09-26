const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MACD = new Schema(
  {
    MACD: { type: String },
    symbol: { type: String }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('MACD', MACD)
