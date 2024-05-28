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

  const qty = quantity * percent

  let buyed = parseFloat(qty.toFixed(qtyPrecision))

  let minSell = minimum
  let multiple = 1

  if (buyed - Math.floor(buyed) < minSell) {
    buyed = Math.floor(buyed)
  }

  let checkNumber = Math.floor(minSell) === minSell ? true : false

  if (!checkNumber) {
    checkFloat = minSell.toString().split('.')
    floatCount = checkFloat[1].length
    multiple = Math.pow(10, floatCount)
  }

  console.log('# Debug session')

  console.log(`buyed ${symbol} : ${buyed} `)
  console.log(`minSell ${symbol} : ${minSell} `)
  console.log(`multiple ${symbol} : ${multiple} `)

  console.log('END Debug session#')

  const getVal = await calSectionStopLoss.calSection(
    priceCal,
    stopPriceCal,
    symbol
  )

  const lastIndex = getVal.real.length - 1

  const x = getVal.real[lastIndex]

  const takeProfit = parseFloat(x[`${lastIndex + 1}`])

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
    takeProfit,
    listTp,
    symbol
  )

  let remain = quantity - buyed
  if (listTp[listTp.length - 1] < minSell) {
    remain += listTp[listTp.length - 1]
    listTp[listTp.length - 1] = 0
  }
  if (zone === 'z2' && listTp.length === 1) {
    if (listTp[0] > minSell) {
      const newList = []
      const mod = listTp[0] % minSell
      newList.push(listTp[0] - mod)
      newList.push(mod)
      listTp = [...newList]
    }
  } else if (zone === 'z1' && listTp.length === 1) {
    if (listTp[0] < minSell) {
      remain += listTp[0]
    }
  }

  const tpDetail = {
    tp: listTp.length === 0 ? z[zone][1] : z[zone]
  }

  return {
    remain: remain,
    tpDetail: tpDetail,
    tpSelect: tpSelect
  }
}

function calPercentZone(
  line,
  priceCal,
  stopPriceCal,
  takeprofit,
  list,
  symbol
) {
  const start = priceCal //ราคาเข้า	priceCal
  const sl = stopPriceCal // SL          stopPriceCal
  const l1 = takeprofit //TP     takeprofit

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
    z1: calSetLine(line, s100distance, start, list, symbol),
    z2: calSetLine(2, h100distance, l2, list, symbol)
  }
}

function calSetLine(section, distance, start, list, symbol) {
  const l = distance / section
  const set = []
  for (i = 1; i <= section; i++) {
    set.push({ tp: start + i * l, qty: list[i - 1] })
  }

  console.log(`calsetline on ${symbol}`, set)
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
