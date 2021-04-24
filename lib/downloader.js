const { promisify } = require('util')
const { getVideoMeta } = require('tiktok-scraper')
const { fetchJson } = require('../utils/fetcher')
const { instagram, twitter } = require('video-url-link')

const igGetInfo = promisify(instagram.getInfo)
const twtGetInfo = promisify(twitter.getInfo)


const tweet = (url) => new Promise((resolve, reject) => {
    console.log(`Get Twitter media from ${url}`)
    twtGetInfo(url, {}, (error, info) => {
        if (error) {
            reject(error)
        } else {
            resolve(info)
        }
    })
})

const insta = (url) => new Promise((resolve, reject) => {
    console.log('Get metadata from =>', url)
    const uri = url.replace(/\?.*$/g, '')
    igGetInfo(uri, {})
        .then((result) => resolve(result))
        .catch((err) => {
            console.error(err)
            reject(err)
        })
})

const tiktok = (url) => new Promise((resolve, reject) => {
    console.log('Get metadata from =>', url)
    getVideoMeta(url, { noWaterMark: true, hdVideo: true })
        .then(async (result) => {
            if (result.videoUrlNoWaterMark) {
                result.url = result.videoUrlNoWaterMark
                result.NoWaterMark = true
            } else {
                result.url = result.videoUrl
                result.NoWaterMark = false
            }
            resolve(result)
        }).catch((err) => {
            console.error(err)
            reject(err)
        })
})

const tikNoWm = (url) => new Promise((resolve, reject) => {
    console.log(`Get TikTok with no WM from ${url}`)
    fetchJson(`https://videfikri.com/api/tiktok/?url=${url}`)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
})

const fb = (url) => new Promise((resolve, reject) => {
    console.log(`Get Facebook media from ${url}`)
    fetchJson(`https://videfikri.com/api/fbdl/?urlfb=${url}`)
        .then((result) => resolve(result))
        .catch((err) => reject(err))
})

module.exports = {
    insta,
    tweet,
    tiktok,
    tikNoWm,
}