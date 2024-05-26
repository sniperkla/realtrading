const axios = require('axios')
const Log = require('../model/log')

const calSection = async (priceCal, stopPriceCal, symbol) => {
  const start = priceCal
  const sl = stopPriceCal

  const sectionSlWithEp = start - sl

  const l1 = 0 //ไม่ได้ใช้ใส่ 0 ไว้
  const l2 = start + sectionSlWithEp

  const h100 = l1 - start
  const hw = l2 - start

  const s100percent = (hw * 100) / h100
  const s100distance = (h100 / 100) * s100percent

  const list100 = await calSetLine(5, s100distance, start)

  const shadowList100 = list100.setForDB
  const percent = (list100.set[4][5] - list100.set[3][4]) / 20

  const percent25 = 25 * percent
  const percent50 = 50 * percent
  list100.set.push({ 6: list100.set[4][5] + percent25 })
  list100.set.push({ 7: list100.set[4][5] + percent50 })
  shadowList100.push({ zone6: list100.set[4][5] + percent25 })
  shadowList100.push({ zone7: list100.set[4][5] + percent50 })

  const combined_object = Object.assign({}, ...shadowList100)
  await Log.updateOne({ symbol: symbol }, { takeProfitZone: combined_object })

  const real = list100.set

  return { real }
}

module.exports = { calSection }

const calSetLine = async (section, distance, start) => {
  let zone = ''
  let setForDB = []
  const l = distance / section
  const set = []
  for (i = 1; i <= section; i++) {
    zone = `zone` + i
    set.push({ [i]: start + i * l })
    setForDB.push({ [zone]: start + i * l })
  }
  return { set, setForDB }
}
