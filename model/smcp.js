const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Smcp = new Schema(
  {
    SMCP: { type: String },
    priceCal: { type: String },
    version: { type: String },
    symbol: { type: String }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Smcp', Smcp)
