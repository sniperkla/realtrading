const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const lineNotifyPost = require('../lib/lineNotifyPost')

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token from BotFather
const token = '7459691142:AAHT3Fxr5I0nMpkdQjH4BS2l_a6-YCKU-ms'
const testTelegrame = async (messages) => {
  const message = messages
  const chatId = -4524106939
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message
    })
    console.log('Message sent successfully')
  } catch (error) {
    console.error(
      'Error sending message to Telegram:',
      error.response ? error.response.data : error.message
    )
    const buyit = {
      text: 'debug',
      msg: `test for telegram Error: ${
        error.response ? error.response.data : error.message
      }`
    }
    await lineNotifyPost.postLineNotify(buyit)
  }
}
module.exports = { testTelegrame }
