const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Storestoploss = new Schema(
  {
    symbol: { type: String },
    stopPriceCalBuy: { type: Number },
    stopPriceCalSell: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Storestoploss', Storestoploss)
