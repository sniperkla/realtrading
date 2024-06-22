require('dotenv').config()

const messageReply = async (body) => {
  const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message'
  const token = process.env.LINEBOT

  console.log(body)
  const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': `${token}`
  }

  return true
}

module.exports = { messageReply }
