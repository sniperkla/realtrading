const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Fixdec = new Schema(
  {
    symbol: { type: String },
    dec: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Fixdec', Fixdec)
