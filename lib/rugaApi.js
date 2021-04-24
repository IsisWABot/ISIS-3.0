const axios = require('axios')
const link = 'https://arugaz.my.id'
const { fetchJson, fetchText } = require('../utils/fetcher')
const fetch = require('node-fetch');

const insta = async (url) => new Promise((resolve, reject) => {
    axios.get(`${link}/api/ig?url=${url}`)
    .then((res) => {
        resolve(`${res.data.result}`)
    })
    .catch((err) => {
        reject(err)
    })
})

const ytmp3 = async (url) => new Promise((resolve, reject) => {
    axios.get(`${link}/api/media/ytaudio?url=${url}`)
    .then((res) => {
		resolve(res.data)
    })
    .catch((err) =>{
        reject(err)
    })
})
const ytmp4 = async (url) => new Promise((resolve, reject) => {
    axios.get(`${link}/api/media/ytvideo?url=${url}`)
    .then((res) => {
		resolve(res.data)
    })
    .catch((err) =>{
        reject(err)
    })
})

const liriklagu = async (lagu) => {
    const response = await fetch('http://scrap.terhambar.com/lirik?word='+lagu)
    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
    const json = await response.json()
    if (json.status) return `Lyrics - ${lagu}\n\n${json.result.lirik}`
}

const ttp = (text) => new Promise((resolve, reject) => {
    console.log('Creating TTP...')
    fetchJson(`https://api.areltiyan.site/sticker_maker?text=${encodeURIComponent(text)}`)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
})

const stalkig = (username) => new Promise((resolve, reject) => {
    console.log(`Searching account for ${username}`)
    fetchJson(`https://docs-jojo.herokuapp.com/api/stalk?username=${username}`)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
})



const stalkigpict = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://docs-jojo.herokuapp.com/api/stalk?username=${url}`)
    .then((res) => {
		if (res.data.error) resolve('https://i.imgur.com/M8UkHax.png')
        resolve(`${res.data.profile_pic_url_hd}`)
    })
    .catch((err) =>{
        reject(err)
    })
})

const quote = async () => new Promise((resolve, reject) => {
    axios.get(`${link}/api/randomquotes`)
    .then((res) => {
        const text = `Author: ${res.data.author}\n\nQuote: ${res.data.quotes}`
        resolve(text)
    })
    .catch((err) =>{
        reject(err)
    })
})



const wiki = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://pt.wikipedia.org/api/rest_v1/page/pdf/${url}/a4`)
    .then((res) => {
		resolve(res)
    })
    .catch((err) =>{
        reject(err)
    })
})

const daerah = async () => new Promise((resolve, reject) => {
    axios.get(`${link}/daerah`)
    .then((res) => {
        resolve(res.data.result)
    })
    .catch((err) =>{
        reject(err)
    })
})

const jadwaldaerah = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://api.haipbis.xyz/jadwalsholat?daerah=${url}`)
    .then((res) => {
		if (res.data.error) resolve(res.data.error)
        const text = `Jadwal Sholat ${url}\n\nImsyak: ${res.data.Imsyak}\nSubuh: ${res.data.Subuh}\nDzuhur: ${res.data.Dzuhur}\nAshar: ${res.data.Ashar}\nMaghrib: ${res.data.Maghrib}\nIsya: ${res.data.Isya}`
        resolve(text)
    })
    .catch((err) =>{
        reject(err)
    })
})

const cuaca = async (url) => new Promise((resolve, reject) => {
    axios.get(`https://rest.farzain.com/api/cuaca.php?id=${url}&apikey=O8mUD3YrHIy9KM1fMRjamw8eg`)
    .then((res) => {
		if (res.data.respon.cuaca == null) resolve('Maaf daerah kamu tidak tersedia')
        const text = `Cuaca di: ${res.data.respon.tempat}\n\nCuaca: ${res.data.respon.cuaca}\nAngin: ${res.data.respon.angin}\nDesk: ${res.data.respon.deskripsi}\nKelembapan: ${res.data.respon.kelembapan}\nSuhu: ${res.data.respon.suhu}\nUdara: ${res.data.respon.udara}`
        resolve(text)
    })
    .catch((err) =>{
        reject(err)
    })
})

const chord = async (url) => new Promise((resolve, reject) => {
    axios.get(`${link}/api/chord?q=${url}`)
    .then((res) => {
		if (res.data.error) resolve(res.data.error)
        resolve(res.data.result)
    })
    .catch((err) =>{
        reject(err)
    })
})

const artinama = async (nama) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/artinama?nama=${nama}`)
	.then((res) => {
		resolve(res.data.result)
	})
	.catch((err) => {
		reject(err)
	})
})

const cekjodoh = async (nama,pasangan) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/jodohku?nama=${nama}&pasangan=${pasangan}`)
	.then((res) => {
		const textc = `Nama : ${res.data.nama}\nPasangan : ${res.data.pasangan}\nPositif: ${res.data.positif}\nNegatif : ${res.data.negatif}`
		resolve({link: res.data.gambar, text: textc})
	})
	.catch((err) => {
		reject(err)
	})
})

const fb = async (url) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/media/facebook?url=${url}`)
	.then((res) => {
		if (res.data.error) resolve({status: 'error', link: 'https://i.imgur.com/M8UkHax.png'})
		resolve({linkhd: res.data.result.hd, linksd: res.data.result.sd})
	})
	.catch((err) =>{
        reject(err)
    })
})

const cooltext = async (teks) => new Promise((resolve, reject) => {
	axios.get(`https://api.haipbis.xyz/randomcooltext?text=${teks}`)
	.then((res) => {
		const textc = `Texto: ${res.data.text}\nCenário: ${res.data.image}`
		resolve({link: res.data.image, text: textc})
	})
	.catch((err) => {
		reject(err)
	})
})

const tulis = async (teks) => new Promise((resolve, reject) => {
    axios.get(`${link}/api/nulis?text=${encodeURIComponent(teks)}`)
    .then((res) => {
        resolve(`${res.data.result}`)
    })
    .catch((err) => {
        reject(err)
    })
})

const bapakfont = async (kalimat) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/bapakfont?kata=${kalimat}`)
	.then((res) => {
		resolve(res.data.result)
	})
	.catch((err) => {
		reject(err)
	})
})

const lirik = async (judul) => new Promise((resolve, reject) => {
	axios.get(`${link}/api/lirik?judul=${judul}`)
	.then((res) => {
		resolve(res.data.result)
	})
	.catch((err) => {
		reject(err)
	})
})

const qrcode = async (url, size) => new Promise((resolve, reject) => {
	axios.get(`http://api.qrserver.com/v1/create-qr-code/?data=${url}&size=${size}x${size}`)
		.then((res) => {
			resolve(`http://api.qrserver.com/v1/create-qr-code/?data=${url}&size=${size}x${size}`)
		})
		.catch((err) => {
            reject(err)
        })
})

const qrread = async (url) => new Promise((resolve, reject) => {
	axios.get(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${url}`)
		.then((res) => {
			if (res.data[0].symbol[0].data == null) return resolve(`Link Inválido.`)
			const textqr = `Resultado: : ${res.data[0].symbol[0].data}`
			resolve(textqr)
		})
		.catch((err) => {
            reject(err)
        })
})



module.exports = {
    insta,
    ytmp3,
    ytmp4,
    fb,
    stalkig,
    stalkigpict,
    quote,
    wiki,
    daerah,
    jadwaldaerah,
    cuaca,
    chord,
    tulis,
	artinama,
	cekjodoh,
    bapakfont,
    cooltext,
    qrcode,
    qrread,
    ttp,
	liriklagu,
}
