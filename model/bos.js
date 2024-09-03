const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Bos = new Schema(
  {
    symbol: { type: String },
    side: { type: String },
    takeProfit: {
      value: { type: Number },
      date: { type: Number }
    },
    stopPriceCal: {
      value: { type: Number },
      date: { type: Number }
    },
    priceCal: {
      value: { type: Number },
      date: { type: Number }
    },
    changePriceCal: {
      type: Boolean,
      default: false
    },
    status: { type: String, default: 'NEW' },
    bosDate: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Bos', Bos)
