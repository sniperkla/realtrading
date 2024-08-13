const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Bos = new Schema(
  {
    symbol: { type: String },
    side: { type: String },
    takeProfit: {
      value: { type: String },
      date: { type: Number }
    },
    stopPriceCal: {
      value: { type: String },
      date: { type: Number }
    },
    priceCal: {
      value: { type: String },
      date: { type: Number }
    },
    status: { type: String },
    bosDate: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Bos', Bos)
