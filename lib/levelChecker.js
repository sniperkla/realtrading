require('dotenv').config()
const { count } = require('console')
const Log = require('../model/log')
const Martingale = require('../model/martinglale')
const MartingaleLog = require('../model/matingalelog')

const martingale = async () => {
  const log = await Log.find()
  const martingale = await Martingale.find()
  const martingaleLog = await MartingaleLog.find()

  const dataMartingaleLog = martingaleLog.map((item) => {
    return item.symbol
  })

  const dataLog = log.map((item) => {
    return item.symbol
  })
  const dataMartingale = martingale.map((item) => {
    return { symbol: item.symbol, previousMargin: item.previousMargin }
  })

  let level = {
    lv1: { name: 5, count: 0, all: 0, left: 0 },
    lv2: { name: 10, count: 0, all: 0, left: 0 },
    lv3: { name: 20, count: 0, all: 0, left: 0 },
    lv4: { name: 40, count: 0, all: 0, left: 0 },
    lv5: { name: 80, count: 0, all: 0, left: 0 },
    lv6: { name: 160, count: 0, all: 0, left: 0 },
    lv7: { name: 320, count: 0, all: 0, left: 0 },
    lv8: { name: 640, count: 0, all: 0, left: 0 },
    lv9: { name: 1280, count: 0, all: 0, left: 0 },
    lv10: { name: 2560, count: 0, all: 0, left: 0 }
  }
  for (let i = 0; i < dataMartingaleLog.length; i++) {
    for (let j = 0; j < dataMartingale.length; j++) {
      if (dataMartingaleLog[i] === dataMartingale[j].symbol) {
        if (dataMartingale[j].previousMargin >= 2560) {
          level.lv10.all = level.lv10.all + 1
        } else if (dataMartingale[j].previousMargin >= 1280) {
          level.lv9.all = level.lv9.all + 1
        } else if (dataMartingale[j].previousMargin >= 640) {
          level.lv8.all = level.lv8.all + 1
        } else if (dataMartingale[j].previousMargin >= 320) {
          level.lv7.all = level.lv7.all + 1
        } else if (dataMartingale[j].previousMargin >= 160) {
          level.lv6.all = level.lv6.all + 1
        } else if (dataMartingale[j].previousMargin >= 80) {
          level.lv5.all = level.lv5.all + 1
        } else if (dataMartingale[j].previousMargin >= 40) {
          level.lv4.all = level.lv4.all + 1
        } else if (dataMartingale[j].previousMargin >= 20) {
          level.lv3.all = level.lv3.all + 1
        } else if (dataMartingale[j].previousMargin >= 10) {
          level.lv2.all = level.lv2.all + 1
        } else if (dataMartingale[j].previousMargin >= 5) {
          level.lv1.all = level.lv1.all + 1
        }
      }

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
  level = { ...level, left: level.lv1.count - level.lv1.all }

  console.log('this is level', level)
  return level
}

module.exports = { martingale }
