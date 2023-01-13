
import { ChatGPTAPIBrowser } from 'chatgpt'


const chatgpt = async (text) => new Promise((resolve, reject) => {
  // use puppeteer to bypass cloudflare (headful because of captchas)
const api = new ChatGPTAPIBrowser({
    email: process.env.OPENAI_EMAIL,
    password: process.env.OPENAI_PASSWORD
})
api.initSession()

const result = api.sendMessage(text)
resolve(result)
})
.catch((err) => {
    reject(err)
    console.log(result.response)
})

module.exports = {
    chatgpt
}