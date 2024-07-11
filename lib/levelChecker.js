require('dotenv').config()
const Log = require('../model/log')
const Martingale = require('../model/martinglale')
const martingale = async () => {
  const log = await Log.find()
  const martingale = await Martingale.find()

  const dataLog = log.map((item) => {
    return item.symbol
  })
  const dataMartingale = martingale.map((item) => {
    return { symbol: item.symbol, previousMargin: item.previousMargin }
  })

  console.log(' dataLog', dataLog)
  console.log(' dataMartingale', dataMartingale)

  let level = {
    lv1: { name: 5, count: 0 },
    lv2: { name: 10, count: 0 },
    lv3: { name: 20, count: 0 },
    lv4: { name: 40, count: 0 },
    lv5: { name: 80, count: 0 },
    lv6: { name: 160, count: 0 },
    lv7: { name: 320, count: 0 },
    lv8: { name: 640, count: 0 },
    lv9: { name: 1280, count: 0 },
    lv10: { name: 2560, count: 0 }
  }
  for (i = 0; i < dataLog.length; i++) {
    for (j = 0; j < dataMartingale.length; j++) {
      if (dataLog[i] === dataMartingale[j].symbol) {
        if (dataMartingale[j].previousMargin >= 2560) {
          level.lv10.count = level.lv10.count + 1
        } else if (dataMartingale[j].previousMargin >= 1280) {
          level.lv9.count = level.lv9.count + 1
        } else if (dataMartingale[j].previousMargin >= 640) {
          level.lv8.count = level.lv8.count + 1
        } else if (dataMartingale[j].previousMargin >= 320) {
          level.lv7.count = level.lv7.count + 1
        } else if (dataMartingale[j].previousMargin >= 160) {
          level.lv6.count = level.lv6.count + 1
        } else if (dataMartingale[j].previousMargin >= 80) {
          level.lv5.count = level.lv5.count + 1
        } else if (dataMartingale[j].previousMargin >= 40) {
          level.lv4.count = level.lv4.count + 1
        } else if (dataMartingale[j].previousMargin >= 20) {
          level.lv3.count = level.lv3.count + 1
        } else if (dataMartingale[j].previousMargin >= 10) {
          level.lv2.count = level.lv2.count + 1
        } else if (dataMartingale[j].previousMargin >= 5) {
          level.lv1.count = level.lv1.count + 1
        }
      }
    }
  }

  return level
}

module.exports = { martingale }
