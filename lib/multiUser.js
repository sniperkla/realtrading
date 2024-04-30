const axios = require('axios')

const multiUser = async (body) => {
  const url = `http://localhost:3030/gettrading`
  try {
    const response = await axios.post(url, body)
    return response.data
    // Log the API response
  } catch (error) {
    return error.response
  }
}

module.exports = { multiUser }
