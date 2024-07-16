const axios = require('axios')
const CryptoJS = require('crypto-js')
const lineNotifyPost = require('../lib/lineNotifyPost')
const trading = require('../model/trading')

// test
// let api_url = 'https://testnet.binancefuture.com/fapi/v1'
// let api_urlv2 = 'https://testnet.binancefuture.com/fapi/v2'

// // real

let api_url = 'https://fapi.binance.com/fapi/v1'
let api_urlv2 = 'https://fapi.binance.com/fapi/v2'

function generateSignature(secretKey, queryString) {
  const hmac = CryptoJS.HmacSHA256(queryString, secretKey)
  const signature = hmac.toString(CryptoJS.enc.Hex) // Convert to uppercase (as required by Binance)

  return signature
}

const manualStoplossZone = async (
  symbol,
  side,
  stopPrice,
  zone,
  status,
  apiKey,
  secretKey
) => {
  const timestamp = Date.now()
  let params = {}
  let orderpath = ''
  if (status === true) {
    orderpath = '/order?' ////
  } else if (status === false) {
    orderpath = '/order/test?'
  }
  const getExchange = await getExchangeInfo(apiKey, secretKey)
  const value = getExchange.data.symbols.filter((item) => {
    return item.symbol === symbol
  })

  const pricePrecision = value[0].pricePrecision

  params = {
    symbol: symbol,
    side: side,
    type: 'STOP_MARKET',
    stopPrice: parseFloat(stopPrice.toFixed(pricePrecision)),
    timeInForce: 'GTC',
    timestamp: timestamp,
    closePosition: true,
    workingType: 'MARK_PRICE',
    recvWindow: 10000
  }

  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}${orderpath}${queryString}&signature=${signature}`

  let response = {}
  try {
    response = await axios.post(url, null, {
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response
  } catch (error) {
    return error.response.data
  }
}

const manualTakeProfit = async (
  symbol,
  side,
  quantity,
  status,
  takeprofit,
  apiKey,
  secretKey,
  closePosition
) => {
  const timestamp = Date.now()
  let params = {}
  let orderpath = ''
  if (status === true) {
    orderpath = '/order?' ////
  } else if (status === false) {
    orderpath = '/order/test?'
  }

  const getExchange = await getExchangeInfo(apiKey, secretKey)
  const value = getExchange.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const pricePrecision = value[0].pricePrecision
  const qtyPrecision = value[0].quantityPrecision

  if (closePosition === true) {
    console.log('tp jaa', takeprofit)
    params = {
      symbol: symbol,
      side: side,
      type: 'TAKE_PROFIT_MARKET',
      closePosition: true,
      stopprice: parseFloat(takeprofit.toFixed(pricePrecision)),
      timeInForce: 'GTC',
      timestamp: timestamp,
      workingType: 'CONTRACT_PRICE'
    }
  } else {
    params = {
      symbol: symbol,
      side: side,
      type: 'TAKE_PROFIT_MARKET',
      quantity: quantity.toFixed(qtyPrecision),
      stopprice: parseFloat(takeprofit.toFixed(pricePrecision)),
      timeInForce: 'GTC',
      timestamp: timestamp,
      workingType: 'CONTRACT_PRICE'
    }
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}${orderpath}${queryString}&signature=${signature}`

  let response = {}
  try {
    response = await axios.post(url, null, {
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response
  } catch (error) {
    return error.response.data
  }
}

const postBinannce = async (
  symbol,
  side,
  quantity,
  type,
  stopPriceCal,
  status,
  takeprofit,
  apiKey,
  secretKey
) => {
  const timestamp = Date.now()
  let orderpath = ''
  if (status === true) {
    orderpath = '/order?' ////
  } else if (status === false) {
    orderpath = '/order/test?'
  }
  const getExchange = await getExchangeInfo(apiKey, secretKey)
  const value = getExchange.data.symbols.filter((item) => {
    return item.symbol === symbol
  })
  const pricePrecision = value[0].pricePrecision
  const qtyPrecision = value[0].quantityPrecision

  let params = {}

  if (type === 'LIMITFIRST') {
    params = {
      symbol: symbol,
      side: side === 'BUY' ? 'SELL' : 'BUY',
      type: 'TAKE_PROFIT_MARKET',
      stopprice: parseFloat(takeprofit.toFixed(pricePrecision)),
      timeInForce: 'GTC',
      timestamp: timestamp,
      closePosition: true,
      workingType: 'CONTRACT_PRICE',
      recvWindow: 10000
    }
  } else if (type === 'LIMIT') {
    params = {
      symbol: symbol,
      side: side,
      type: 'TAKE_PROFIT_MARKET',
      quantity: parseFloat(quantity.toFixed(qtyPrecision)),
      stopprice: parseFloat(takeprofit.toFixed(pricePrecision)),
      timeInForce: 'GTC',
      timestamp: timestamp,
      workingType: 'CONTRACT_PRICE'
    }
  } else if (type === 'MARKET') {
    params = {
      symbol: symbol,
      side: side,
      type: 'MARKET',
      // positionSide: positionSide,
      quantity: parseFloat(quantity.toFixed(qtyPrecision)),
      timestamp: timestamp,
      recvWindow: 10000
    }
  } else if (type === 'STOP_MARKET') {
    console.log('stop side', side)
    params = {
      symbol: symbol, // Replace with your symbol
      side: side, // Assuming you have a long position (buying)
      // positionSide: positionSide,
      type: 'STOP_MARKET',
      stopPrice: parseFloat(stopPriceCal.toFixed(pricePrecision)),
      timeInForce: 'GTC',
      timestamp: timestamp,
      closePosition: true,
      workingType: 'MARK_PRICE',
      recvWindow: 10000
    }
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}${orderpath}${queryString}&signature=${signature}`

  let response = {}
  try {
    response = await axios.post(url, null, {
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response

    // Log the API response
  } catch (error) {
    console.error(
      `Error sending Binance API request ${type}:`,
      error.response.data
    )
    return error.response
  }
}

const cancleOrder = async (symbol, orderId, apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    symbol: symbol,
    orderId: orderId,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/order?${queryString}&signature=${signature}`
  try {
    const response = await axios.delete(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    // console.log(response.data) // Log the API response
    return response
  } catch (error) {
    console.error(
      'Error sending Binance API request cancleOrder :',
      error.response
    )
    return error.response.status
  }
}

const getPrice = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()
  const params = {
    symbol: symbol,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/ticker/price?${queryString}&signature=${signature}`
  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data.price
  } catch (error) {
    console.error(
      'Error sending Binance API request getPrice:',
      error.response.data
    )
    return error.response
  }
}

const getMarketPrice = async (symbol, apiKey, secretKey) => {
  const params = {
    symbol: symbol,
    limit: 5
    // timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/depth?${queryString}&signature=${signature}`
  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
    // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getMarketPrice:',
      error.response.data
    )
    return error.response
  }
}

const changeLeverage = async (symbol, leverage, apiKey, secretKey) => {
  const timestamp = Date.now()
  const params = {
    symbol: symbol,
    leverage: leverage,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/leverage?${queryString}&signature=${signature}`
  try {
    const response = await axios.post(url, null, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data
    // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request changeLeverage:',
      error.response.data
    )
    return error.response
  }
}

const getFundingRate = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()
  const params = {
    symbol: symbol,
    limit: 1
    // timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/fundingRate?${queryString}&signature=${signature}`
  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data

    // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getFundingrate:',
      error.response.data
    )
    return error.response
  }
}

const getLeverageInitial = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()
  const params = {
    symbol: symbol,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/leverageBracket?${queryString}&signature=${signature}`
  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data[0].brackets[0].initialLeverage

    // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getLeverageInitial:',
      error.response.data
    )
    return error.response
  }
}

const getDefultMagin = async (apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_urlv2}/balance?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getDefaultmagins:',
      error.response.data
    )
    return error.response
  }
}

const changeMarginType = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    symbol: symbol,
    marginType: 'CROSSED',
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/marginType?${queryString}&signature=${signature}`

  try {
    const response = await axios.post(url, null, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request changeMarginType:',
      error.response.data
    )
    return error.response
  }
}

const getExchangeInfo = async (apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    timestamp: timestamp
  }

  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/exchangeInfo?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getExhangeInfo:',
      error.response.data
    )
    return error.response
  }
}

const getMarkPrice = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    symbol: symbol,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/premiumIndex?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data.markPrice // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getMarketPrice:',
      error.response.data
    )
    return error.response
  }
}

const getOrder = async (orderId, symbol, apiKey, secretKey) => {
  const timestamp = Date.now()
  const params = {
    symbol: symbol,
    orderId: orderId,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/order?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getOrder:',
      error.response.data
    )
    return error.response
  }
}

const getNotionalLv = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    symbol: symbol,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/leverageBracket?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getNotionalLv:',
      error.response.data
    )
    return error.response
  }
}
const getAllOpenOrder = async (apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_url}/openOrders?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getAllOpenOrder:',
      error.response.data
    )
    return error.response
  }
}

const getAccountInfo = async (apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    timestamp: timestamp,
    recvWindow: 10000
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_urlv2}/account?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getAccountInfo:',
      error.response.data
    )
    return error.response
  }
}
const getPositionRisk = async (symbol, apiKey, secretKey) => {
  const timestamp = Date.now()

  const params = {
    symbol: symbol,
    timestamp: timestamp
  }
  const queryString = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  const signature = generateSignature(secretKey, queryString)

  const url = `${api_urlv2}/positionRisk?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      // Send an empty body for POST requests in Binance Futures API
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.data // Log the API response
  } catch (error) {
    console.error(
      'Error sending Binance API request getPositionRisk:',
      error.response.data
    )
    return error.response
  }
}
module.exports = {
  getPrice,
  postBinannce,
  cancleOrder,
  getMarketPrice,
  changeLeverage,
  getFundingRate,
  getLeverageInitial,
  getDefultMagin,
  changeMarginType,
  getExchangeInfo,
  getMarkPrice,
  getOrder,
  getNotionalLv,
  getAllOpenOrder,
  manualTakeProfit,
  getAccountInfo,
  manualStoplossZone,
  getPositionRisk
}
