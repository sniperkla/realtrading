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

  const list100 = await calSetLine(4, s100distance, start)

  const shadowList100 = list100.setForDB

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
