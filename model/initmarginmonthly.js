const mongoose = require('mongoose')
const Schema = mongoose.Schema

const initMargin = new Schema(
  {
    _id: { type: String },
    monthlyMargin: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('initmargin', initMargin)
