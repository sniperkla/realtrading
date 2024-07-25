const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Pearson = new Schema(
  {
    STP: { type: Number },
    pricecal: { type: String },
    version: { type: String },
    symbol: { type: String }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Pearson', Pearson)
