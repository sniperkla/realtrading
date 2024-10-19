const mongoose = require('mongoose')
const Schema = mongoose.Schema

const initMargin = new Schema(
  {
    _id: { type: String },
    value: { type: Number, default: 0 },
    highest: { type: Number, default: 0 },
    margin: { type: Number, default: 0 },
    cum: { type: Number, default: 0 },
    highestcum: { type: Number, default: 0 },
    peakvalue: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('initmargin', initMargin)
