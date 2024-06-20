const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logwinrate = new Schema(
  {
    symbol: { type: String },
    status: { type: String },
    marketLog: { type: Object }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('logwinrate', logwinrate)
