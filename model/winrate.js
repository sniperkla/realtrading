const mongoose = require('mongoose')
const Schema = mongoose.Schema

const WinRate = new Schema(
  {
    win: { type: Number, default: 0 },
    lose: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Winrate', WinRate)
