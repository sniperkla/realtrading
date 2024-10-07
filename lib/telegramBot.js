const TelegramBot = require('node-telegram-bot-api')
const axios = require('axios')

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token from BotFather
const token = '7459691142:AAHT3Fxr5I0nMpkdQjH4BS2l_a6-YCKU-ms'
const testTelegrame = async (messages) => {
  const message = messages
  const chatId = 5436398702
  // Function to send a message via Telegram API
  async function sendMessageToTelegram(chatId, message) {
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
    }
  }

  // Example: Send the message when your backend event happens
  sendMessageToTelegram(chatId, message)
}
module.exports = { testTelegrame }
