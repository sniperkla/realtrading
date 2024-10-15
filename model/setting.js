const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Setting = new Schema(
  {
    _id: { type: String },
    value: { type: Number },
    status: { type: Boolean },
    start: { type: Number },
    end: { type: Number }
  },
  {
    timestamps: true
  }
)
module.exports = mongoose.model('Setting', Setting)
