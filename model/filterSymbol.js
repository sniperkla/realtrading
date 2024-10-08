const mongoose = require('mongoose')
const Schema = mongoose.Schema

const filterSymbol = new Schema(
  {
    symbol: { type: String },
    status: { type: Boolean }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('filterSymbol', filterSymbol)
