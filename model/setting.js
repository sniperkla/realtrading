const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Setting = new Schema(
  {
    _id: { type: String },
    value: { type: Number },
    status: { type: Boolean }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Setting', Setting)
