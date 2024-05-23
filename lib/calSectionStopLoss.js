const axios = require('axios')

const calSection = async (priceCal, stopPriceCal) => {
  const start = priceCal
  const sl = stopPriceCal

  const sectionSlWithEp = start - sl

  const l1 = 0 //ไม่ได้ใช้ใส่ 0 ไว้
  const l2 = start + sectionSlWithEp

  const h100 = l1 - start
  const hw = l2 - start

  const s100percent = (hw * 100) / h100
  const s100distance = (h100 / 100) * s100percent

  const list100 = calSetLine(5, s100distance, start)
  const percent = (list100[4][5] - list100[3][4]) / 20

  const percent25 = 25 * percent
  const percent50 = 50 * percent

  list100.push({ 6: list100[4][5] + percent25 })
  list100.push({ 7: list100[4][5] + percent50 })

  function calSetLine(section, distance, start) {
    const l = distance / section
    const set = []
    for (i = 1; i <= section; i++) {
      set.push({ [i]: start + i * l })
    }
    return set
  }

  return { list100 }
}

module.exports = { calSection }
