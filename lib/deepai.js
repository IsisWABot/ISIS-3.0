const deepai = require('deepai'); // OR include deepai.min.js as a script tag in your HTML


const imagine = (text) => new Promise((resolve, reject) => {
    deepai.setApiKey('quickstart-QUdJIGlzIGNvbWluZy4uLi4K');

    console.log(`Imaginando a partir do texto: ${text}`)
    (async function() {
    var resp = await deepai.callStandardApi("text2img", {
        text: text,
}).then(() => resolve(resp))
.catch((err) => {
    console.error(err)
    reject(err)
})
})

})

module.exports = {
    imagine}
