const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Martingale = new Schema(
  {
    symbol: { type: String },
    previousMargin: { type: Number },
    stackLose: { type: Number, default: 1 },
    highestMargin: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Martingale', Martingale)
