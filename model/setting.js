const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Setting = new Schema(
  {
    autoTakeprofit: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Setting', Setting)
