const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Martingale = new Schema(
  {
    symbol: { type: String },
    martingale: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Martingalelog', Martingale)
