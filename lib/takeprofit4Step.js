const apiBinance = require('../lib/apibinance')
const calSectionStopLoss = require('../lib/calSectionStopLoss')

// const result = calTp(quantityStart, 0.72, 4, 'z1')
// console.log(result.tpDetail.list)
// console.log(result.tpDetail.line)

// const result2 = calTp(result.remain, 1, 1, 'z2')
// console.log(result2.tpDetail.list)

const calTakeprofit4Step = async (
  symbol,
  side,
  quantity,
  type,
  stopPriceCal,
  status,
  takeprofit,
  apiKey,
  secretKey,
  minimum,
  priceCal,
  running,

  percent,
  indexTp,
  zone
) => {
  const getExchange = await apiBinance.getExchangeInfo(apiKey, secretKey)

  const value = getExchange.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const qtyPrecision = value[0]?.quantityPrecision

  let buyed = parseFloat(quantity.toFixed(qtyPrecision)) * percent
  let minSell = running
  let multiple = Math.pow(10, qtyPrecision)

  if (buyed - Math.floor(buyed) < minSell) {
    buyed = Math.floor(buyed)
  }

  const getVal = await calSectionStopLoss.calSection(priceCal, stopPriceCal)
  const lastIndex = getVal.list100.length - 1

  const x = getVal.list100[lastIndex]

  const takeProfit = parseFloat(x[`${lastIndex + 1}`])

  if (buyed - Math.floor(buyed) < minSell) {
    buyed = Math.floor(buyed)
  }

  tpSet = [
    { tp: 'tp1', value: [100], line: 1 },
    { tp: 'tp2', value: [50, 50], line: 2 },
    { tp: 'tp3', value: [33, 33, 33], line: 3 },
    { tp: 'tp4', value: [25, 25, 25, 25], line: 4 },
    { tp: 'tp5', value: [20, 20, 20, 20, 20], line: 5 }
  ]

  let tpSelect = ''
  let listTp = []

  tpSet.map((tp, key) => {
    if (key <= indexTp) {
      let check = tp.value.length
      let remain = buyed

      let listShow = []
      tp.value.map((item) => {
        if (remain < minSell && remain !== 0) {
          check--
          listShow.push(remain)
          remain = 0
        } else {
          let quantitySell = buyed * (item / 100)
          if (quantitySell > minSell) {
            quantitySell = Math.floor(quantitySell * multiple) / multiple
          } else {
            quantitySell = Math.ceil(quantitySell * multiple) / multiple
          }

          if (quantitySell >= minSell && remain - quantitySell >= 0) {
            check--

            remain = Math.round((remain - quantitySell) * multiple) / multiple
            listShow.push(quantitySell)
          }
        }
      })

      if (check === 0) {
        tpSelect = tp.tp
        listTp = listShow
        if (remain !== 0) {
          listTp[listTp.length - 1] += remain
          listTp[listTp.length - 1] =
            Math.floor(listTp[listTp.length - 1] * multiple) / multiple
        }
      }
    }
  })

  const tpFilter = tpSet.find((tp) => {
    return tp.tp === tpSelect
  })

  const z = calPercentZone(
    tpFilter?.line || 1,
    priceCal,
    stopPriceCal,
    takeProfit
  )

  const tpDetail = {
    list: listTp,
    line: listTp.length === 0 ? z[zone][1] : z[zone]
  }

  return {
    remain: quantity - buyed,
    tpDetail: tpDetail,
    tpSelect: tpSelect
  }
}

function calPercentZone(line, priceCal, stopPriceCal, takeprofit) {
  const start = priceCal //ราคาเข้า	priceCal
  const sl = stopPriceCal // SL          stopPriceCal
  const l1 = takeprofit //TP     takeprofit

  console.log('Noice2', takeprofit)
  const sectionSlWithEp = start - sl
  const l2 = start + sectionSlWithEp

  //console.log('l2 ' , l2)
  //console.log('*****************************************************************************')
  const h100 = l1 - start
  const hw = l2 - start

  const s100percent = (hw * 100) / h100
  const s100distance = (h100 / 100) * s100percent

  //console.log('percent s100' , s100percent)
  //console.log('distance s100' , s100distance)

  //console.log('*****************************************************************************')
  const h100percent = 100 - s100percent
  const h100distance = (h100 / 100) * h100percent

  //console.log('percent h100' , h100percent)
  //console.log('distance h100' , h100distance)

  return {
    z1: calSetLine(line, s100distance, start),
    z2: calSetLine(2, h100distance, l2)
  }
}

function calSetLine(section, distance, start) {
  const l = distance / section
  const set = []
  for (i = 1; i <= section; i++) {
    set.push({ [i]: start + i * l })
  }
  return set
}
module.exports = { calTakeprofit4Step }

// const calPercentZone = async (line, priceCal, stopPriceCal, takeprofit) => {
//   const getVal = await calSectionStopLoss.calSection(priceCal, stopPriceCal)
//   const lastIndex = getVal.list100.length - 1

//   const x = getVal.list100[lastIndex]

//   const start = priceCal
//   const sl = stopPriceCal
//   const l1 = parseFloat(x[`${lastIndex + 1}`])

//   const sectionSlWithEp = start - sl
//   const l2 = start + sectionSlWithEp

//   //console.log('l2 ' , l2)
//   //console.log('*****************************************************************************')
//   const h100 = l1 - start
//   const hw = l2 - start

//   const s100percent = (hw * 100) / h100
//   const s100distance = (h100 / 100) * s100percent

//   //console.log('percent s100' , s100percent)
//   //console.log('distance s100' , s100distance)

//   //console.log('*****************************************************************************')
//   const h100percent = 100 - s100percent
//   const h100distance = (h100 / 100) * h100percent

//   //console.log('percent h100' , h100percent)
//   //console.log('distance h100' , h100distance)

//   return {
//     z1: calSetLine(line, s100distance, start),
//     z2: calSetLine(2, h100distance, l2)
//   }
// }

// function calSetLine(section, distance, start) {
//   const l = distance / section
//   const set = []
//   for (i = 1; i <= section; i++) {
//     set.push({ [i]: start + i * l })
//   }
//   return set
// }
