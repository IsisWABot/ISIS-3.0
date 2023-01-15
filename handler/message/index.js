require('dotenv').config()
const {
    decryptMedia
} = require('@open-wa/wa-automate')
const fs = require('fs-extra')
const axios = require('axios')
const request = require('request');
const fetch = require('node-fetch')
const moment = require('moment-timezone')
const CepCoords = require("coordenadas-do-cep");
const canvas = require('canvacord')
const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const os = require('os')
moment.tz.setDefault('Brasil/São Paulo').locale('br')
const puppeteer = require('puppeteer')
const {
    exec
} = require('child_process')
const ocrSpaceApi = require('ocr-space-api');
const {
    uploadImages
} = require('../../utils/fetcher')
const mathjs = require('mathjs')
const {
    downloader,
    urlShortener,
    meme,
    translate,
    images,
    rugaapi,
    welkom,
    upload
} = require('../../lib')
const {
    msgFilter,
    color,
    processTime,
    is,
    isUrl
} = require('../../utils')
const {
    removeBackgroundFromImageBase64
} = require('remove.bg')
const {
    menuBR
} = require('./text') // Menu do BOT
let antilink = JSON.parse(fs.readFileSync('handler/message/text/antilink.json'))
const ownerNumber = '5517991766836@c.us';
const groupLimit = 10;

const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = msgHandler = async (client, message) => {
    try {
        const {
            type,
            id,
            from,
            t,
            sender,
            isGroupMsg,
            chat,
            caption,
            isMedia,
            mimetype,
            quotedMsg,
            mentionedJidList,
            chatId
        } = message
        let {
            body
        } = message
        const {
            name,
            formattedTitle
        } = chat
        let {
            pushname,
            verifiedName,
            formattedName
        } = sender
        pushname = pushname || verifiedName || formattedName
        const botNumber = await client.getHostNumber() + '@c.us'
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const chats = (type === 'chat') ? body : (type === 'image' || type === 'video') ? caption : ''
        const isGroupAdmins = groupAdmins.includes(sender.id) || false
        const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
        const isOwner = ownerNumber == sender.id
        const user = sender.id
        const GroupLinkDetector = antilink.includes(chatId)


        // Bot Prefix
        const prefix = '#'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : (((type === 'image' || type === 'video') && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const arg = body.substring(body.indexOf(' ') + 1)
        const args = body.trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)
        const q = args.join(' ')
        const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
        const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'
        const isQuotedSticker = quotedMsg && quotedMsg.type === 'sticker'
        const isQuotedGif = quotedMsg && quotedMsg.mimetype === 'image/gif'
        const isImage = type === 'image'
        const isVideo = type === 'video'
        const isGif = mimetype === 'image/gif'
        const url = args.length !== 0 ? args[0] : ''
        const uaOverride = process.env.UserAgent

        //Trava de grupos
        if (isGroupMsg && !isGroupAdmins && !isOwner && isBotGroupAdmins) {
            try {
                if (chats.length > 5000) {
                    await client.sendTextWithMentions(from, `Caso isso não seja uma trava, peço que contate meu dono.`)
                    await client.removeParticipant(groupId, user)
                    await client.contactBlock(user) // Caso sua bot não seja imune
                }
            } catch (error) {
                return
            }
        }

        // Bloqueia travas no PV que tenham mais de 5.000 linhas
        if (!isGroupMsg && !isOwner) {
            try {
                if (chats.length > 5000) {
                    await client.sendText(ownerNumber, `Posso ter recebido uma trava de texto do wa.me/${user.replace('@c.us', '')} e então o bloqueei, peço que verifique.`)
                    await client.contactBlock(user) // Caso sua bot não seja imune
                }
            } catch (error) {
                return
            }
        }


        //Antilink
        if (isGroupMsg && GroupLinkDetector && !isGroupAdmins && !isOwner) {
            if (chats.match(/(https:\/\/chat.whatsapp.com)/gi)) {
                const check = await client.inviteInfo(chats);
                if (!check) {
                    return
                } else {
                    client.reply(from, '*[LINK DE GRUPO]*\nVocê não pode enviar links de grupo aqui :(', id).then(() => {
                        client.sendText(sender.id, 'Você foi removido do grupo por enviar um link não aceito.\n*Obs: Mensagem Automática.*')
                        client.removeParticipant(groupId, sender.id)
                    })
                }
            } else if (chats.match(new RegExp(/(https:\/\/chat.(?!whatsapp.com))/gi))) {
                const check = await client.inviteInfo(chats);
                client.reply(from, '*[LINK DE GRUPO FALSO/FAKE]*\nVocê não pode enviar links de grupo aqui :( \n*_ATENÇÃO NÃO ENTREM NO LINK!_*', id).then(() => {
                    client.sendText(sender.id, 'Você foi removido do grupo por enviar um link não aceito.\n*Obs: Mensagem Automática.*')
                    client.removeParticipant(groupId, sender.id)
                })
            }
        }


        // [BETA] AntiSPAM
        if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg) {
            return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'de', color(pushname))
        }
        if (isCmd && msgFilter.isFiltered(from) && isGroupMsg) {
            return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'de', color(pushname), 'no grupo', color(name || formattedTitle))
        }
        if (!msgFilter.isFiltered(from) && !isMedia && !isCmd) {
            try {
                if (chats.includes(`@${botNumber.replace('@c.us', '')}`)) {
                    await client.reply(from, 'Oii, tô aqui!', id)
                }
            } catch (error) {
                return
            }
        }
        if (!isCmd && !isGroupMsg) {
            return console.log('[MENSAGEM]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Mensagem Comum de ', color(pushname))
        }
        if (!isCmd && isGroupMsg) {
            return console.log('[MENSAGEM]', color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Mensagem Comum de', color(pushname), ', no grupo:', color(name || formattedTitle))
        }
        if (isCmd && !isGroupMsg) {
            console.log(color('[COMANDO]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`O Comando "${command} [${args.length}]"`), 'foi Executado por ', color(pushname))
        }
        if (isCmd && isGroupMsg) {
            console.log(color('[COMANDO]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`O Comando "${command} [${args.length}]"`), 'foi Executado por ', color(pushname), ', no grupo:', color(name || formattedTitle))
        }
        msgFilter.addFilter(from)

        client.sendSeen(chatId)


        switch (command) {
            // Menu
            case 'ping':
                await client.sendText(from, `👩🏽 IsisBOT by Igor.Sardinhaa\n\n 📶 *PING:* _${processTime(t, moment()).toFixed(1)} ms_`)
                break
            case 'help':
            case 'menu':
            case 'ajuda':
                await client.sendText(from, menuBR.textMenu(pushname))
                break
            case 'comandos':
                await client.sendText(from, menuBR.aliases(pushname))
                break
            case 'menuadmin':
                if (!isGroupMsg) return client.reply(from, '[🤷🏽‍♀️] *Atenção!* \nEsse comando só funciona em Grupos.', id)
                if (!isGroupAdmins) return client.reply(from, '[🤷🏽‍♀️] *Atenção!* \nEsse comando só pode ser executado pelo(s) Administrador(es) do Grupo.', id)
                await client.sendText(from, menuBR.textAdmin())
                break

                //Stickers
            case 'sticker':
            case 'figurinha':
            case 'fig':
            case 'stk':
            case 'adesivo':
            case 'stiker':
                if (isMedia && isImage && args.length === 0) {
                    const mediaData = await decryptMedia(message, uaOverride)
                    const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64, {
                        author: 'https://igorsardinha.com.br',
                        pack: '👩🏽‍💻 Isis Bot ',
                        keepScale: true
                    })
                } else if (quotedMsg && isQuotedImage) {
                    if (args.length === 1 && args[0] == 'crop') {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64, {
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot '
                        })
                    } else if (args.length === 1 && args[0] == 'circle') {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64, {
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot ',
                            circle: true
                        })
                    } else {
                        const mediaData = await decryptMedia(quotedMsg, uaOverride)
                        const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                        await client.sendImageAsSticker(from, imageBase64, {
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot ',
                            keepScale: true
                        })
                    }
                } else if (args.length === 1 && args[0] == 'crop') {
                    const mediaData = await decryptMedia(message, uaOverride)
                    const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64, {
                        author: 'https://igorsardinha.com.br',
                        pack: '👩🏽‍💻 Isis Bot '
                    })
                } else if (args.length === 1 && args[0] == 'circle') {
                    const mediaData = await decryptMedia(message, uaOverride)
                    const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendImageAsSticker(from, imageBase64, {
                        author: 'https://igorsardinha.com.br',
                        pack: '👩🏽‍💻 Isis Bot ',
                        circle: true
                    })
                } else {
                    await client.reply(from, '[🤷🏽‍♀️] Me manda uma imagem com a legenda *#sticker* ou responda uma imagem com o texto *#sticker*. Para figurinhas animadas utilize *#sgif*.', id)
                }
                break
                //
            case 'stickergif':
            case 'stikergif':
            case 'sgif':
            case 'gifstiker':
            case 'gifsticker':
            case 'figanimada':
            case 'figurinhaanimada':
                if (isMedia && isVideo || isGif || isQuotedVideo || isQuotedGif) {
                    await client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                    const encryptMedia = isQuotedGif || isQuotedVideo ? quotedMsg : message
                    const mediaData = await decryptMedia(encryptMedia, uaOverride)
                    await client.sendMp4AsSticker(from, mediaData, null, {
                            stickerMetadata: true,
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot ',
                            fps: 24,
                            startTime: '00:00:00.0',
                            endTime: '00:00:05.0',
                            crop: false,
                            loop: 0
                        })
                        .catch(() => {
                            client.reply(from, `🤦🏽‍♀️ Ops.. Algo deu errado!`, id)
                        })
                } else return client.reply(from, '🤦🏽‍♀️ Esse comando só funciona com Videos e GIFs', id)
                break
                //
            case 'stikertoimg':
            case 'stickertoimg':
            case 'stimg':
            case 'stk-img':
                if (quotedMsg && isQuotedSticker) {
                    const mediaData = await decryptMedia(quotedMsg)
                    client.reply(from, `[👩🏽‍💻] Paraê... Estou carregando o Sticker...`, id)
                    const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                    await client.sendFile(from, imageBase64, 'imgsticker.jpg', '💁🏽‍♀️ Consegui fazer essa imagem a partir do Sticker!', id)
                        .then(() => {
                            console.log(`Tempo de Processamento: ${processTime(t, moment())}s`)
                        })
                } else if (!quotedMsg) return client.reply(from, `🤦🏽‍♀️ Ops.. Algo deu errado!`, id)
                break
                //
            case 'stikertogif':
            case 'stickertogif':
            case 'stgif':
            case 'stk-gif':
                if (quotedMsg && isQuotedSticker) {
                    const mediaData = await decryptMedia(quotedMsg)
                    client.reply(from, `[👩🏽‍💻] Paraê... Estou carregando o Sticker...`, id)
                    const gifBase64 = uploadImages(mediaData, false)
                    await client.sendFileFromUrl(from, gifBase64, 'gifsticker.gif', '💁🏽‍♀️ Consegui fazer esse GIF a partir do Sticker!', id)
                        .then(() => {
                            console.log(`Tempo de Processamento: ${processTime(t, moment())}s`)
                        })
                } else if (!quotedMsg) return client.reply(from, `🤦🏽‍♀️ Ops.. Algo deu errado!`, id)
                break
                //
            case 'stickernobg':
            case 'stikernobg':
            case 'figurinhapng':
            case 'stickerpng':
            case 'spng':
                if (isMedia && isImage) {
                    try {
                        client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                        var mediaData = await decryptMedia(message, uaOverride)
                        var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                        var base64img = imageBase64
                        var outFile = './media/img/noBg.png'
                        var result = await removeBackgroundFromImageBase64({
                            base64img,
                            apiKey: '11GwW7iq6qy3PBSHVzoknN6f',
                            size: 'auto',
                            type: 'auto',
                            outFile
                        })
                        await fs.writeFile(outFile, result.base64img)
                        await client.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`, {
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot ',
                            keepScale: true
                        })
                    } catch (err) {
                        console.log(err)
                        client.reply(from, '🤦🏽‍♀️ Ops.. Algo deu errado!', id)
                    }
                } else {
                    client.reply(from, '[🤷🏽‍♀️] Me manda uma imagem com a legenda *#stickernobg* ou responda uma imagem com o texto *#stickernobg*..', id)
                }
                break
                //
            case 'ttp':
            case 'stickertexto':
            case 'stktxt':
            case 'sttext':
                if (!q) return await client.reply(from, '[🤷🏽‍♀️] Você precisa escrever um texto após o comando para eu realizar essa ação.', id)
                await client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                const ttpst = await axios.get(`https://st4rz.herokuapp.com/api/ttp?kata=${encodeURIComponent(q)}`)
                await client.sendImageAsSticker(from, ttpst.data.result, {
                    author: 'https://igorsardinha.com.br',
                    pack: '👩🏽‍💻 Isis Bot ',
                    keepScale: true
                })
                break
                //
            case 'attp':
            case 'sttextogif':
            case 'stickertextogif':
                if (!q) return await client.reply(from, '[🤷🏽‍♀️] Você precisa escrever um texto após o comando para eu realizar essa ação.', id)
                await client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                await axios.get(`https://api.xteam.xyz/attp?file&text=${encodeURIComponent(q)}`, {
                    responseType: 'arraybuffer'
                }).then(async (response) => {
                    const attp = Buffer.from(response.data, 'binary').toString('base64')
                    await client.sendImageAsSticker(from, attp, {
                        author: 'https://igorsardinha.com.br',
                        pack: '👩🏽‍💻 Isis Bot ',
                        keepScale: true
                    })
                })
                break
                //    
            case 'swasted':
            case 'stickergta':
            case 'sefodeu':
                if (isMedia && type === 'image' || isQuotedImage) {
                    await client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                    const wastedmd = isQuotedImage ? quotedMsg : message
                    const wstddt = await decryptMedia(wastedmd, uaOverride)
                    const wastedUpl = await uploadImages(wstddt, false)
                    const wastedurl = `https://some-random-api.ml/canvas/wasted?avatar=${wastedUpl}`
                    await client.sendImageAsSticker(from, wastedurl, {
                            author: 'https://igorsardinha.com.br',
                            pack: '👩🏽‍💻 Isis Bot ',
                            keepScale: true
                        })
                        .catch(() => {
                            client.reply(from, 'Ocorreu uma falha ao enviar a imagem, tente novamente mais tarde.', id)
                        })
                } else return client.reply(from, '🤦🏽‍♀️ Esse comando só funciona com Imagens', id)
                break
                //
            case 'getsticker':
                if (args.length == 0) return client.reply(from, 'Informe um termo para pesquisar um stikcer', id)
                const stkm = await fetch(`https://api.fdci.se/sosmed/rep.php?gambar=${encodeURIComponent(q)}`)
                const stimg = await stkm.json()
                let stkfm = stimg[Math.floor(Math.random() * stimg.length) + 1]
                await client.sendStickerfromUrl(from, stkfm, {
                    method: 'get'
                }, {
                    author: 'https://igorsardinha.com.br',
                    pack: '👩🏽‍💻 Isis Bot ',
                    keepScale: true
                })
                break
                //
                //Downloads de Media
                //
            case 'ig':
            case 'instagram':
            case 'insta':
                if (args.length !== 1) return client.reply(from, '[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#insta link_do_post*', id)
                if (!is.Url(url) & !url.includes('instagram.com')) return client.reply(from, '[🤷🏽‍♀️] Parece que este Link não é do Instagram!', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                downloader.insta(url).then(async (data) => {
                        if (data.type == 'GraphSidecar') {
                            if (data.image.length != 0) {
                                data.image.map((x) => client.sendFileFromUrl(from, x, 'photo.jpg', '', null, null, true))
                                    .then((serialized) => console.log(`Successfully sending files with id: ${serialized} processed during ${processTime(t, moment())}`))
                                    .catch((err) => console.error(err))
                            }
                            if (data.video.length != 0) {
                                data.video.map((x) => client.sendFileFromUrl(from, x.videoUrl, 'video.jpg', '', null, null, true))
                                    .then((serialized) => console.log(`Successfully sending files with id: ${serialized} processed during ${processTime(t, moment())}`))
                                    .catch((err) => console.error(err))
                            }
                        } else if (data.type == 'GraphImage') {
                            client.sendFileFromUrl(from, data.image, 'photo.jpg', '', null, null, true)
                                .then((serialized) => console.log(`Successfully sending files with id: ${serialized} processed during ${processTime(t, moment())}`))
                                .catch((err) => console.error(err))
                        } else if (data.type == 'GraphVideo') {
                            client.sendFileFromUrl(from, data.video.videoUrl, 'video.mp4', '', null, null, true)
                                .then((serialized) => console.log(`Successfully sending files with id: ${serialized} processed during ${processTime(t, moment())}`))
                                .catch((err) => console.error(err))
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                        if (err === 'Not a video') {
                            return client.reply(from, '[🤷🏽‍♀️] Este link está inválido...', id)
                        }
                        client.reply(from, '[🤷🏽‍♀️] Não foi possível fazer este download.', id)
                    })
                break
                //
            case 'twt':
            case 'twitter':
                if (args.length !== 1) return client.reply(from, '\n[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#twt link_do_post* \n', id)
                if (!is.Url(url) & !url.includes('twitter.com') || url.includes('t.co')) return client.reply(from, '[🤷🏽‍♀️] Parece que este Link não é do Twitter!', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                downloader.tweet(url).then(async (data) => {
                        if (data.type === 'video') {
                            const content = data.variants.filter(x => x.content_type !== 'application/x-mpegURL').sort((a, b) => b.bitrate - a.bitrate)
                            const result = await urlShortener(content[0].url)
                            await client.sendFileFromUrl(from, content[0].url, 'video.mp4', `Download: ${result} \n\nTempo de Carregamento: _${processTime(t, moment())}s_`, null, null, true)
                                .then((serialized) => console.log(`Carregando Conteúdo Externo: ${serialized}. Tempo Decorrido: ${processTime(t, moment())}`))
                                .catch((err) => console.error(err))
                        } else if (data.type === 'photo') {
                            for (let i = 0; i < data.variants.length; i++) {
                                await client.sendFileFromUrl(from, data.variants[i], data.variants[i].split('/media/')[1], '', null, null, true)
                                    .then((serialized) => console.log(`Carregando Conteúdo Externo: ${serialized}. Tempo Decorrido: ${processTime(t, moment())}`))
                                    .catch((err) => console.error(err))
                            }
                        }
                    })
                    .catch(() => client.sendText(from, '[🤷🏽‍♀️] Vish... Eu não sei porque mais não deu certo pra eu fazer isso!'))
                break
                //        
            case 'tiktok':
            case 'tik':
                if (args.length !== 1) return client.reply(from, '[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#tiktok link_do_post*', id)
                if (!is.Url(url) && !url.includes('tiktok.com')) return client.reply(from, '[🤷🏽‍♀️] Parece que este Link não é do TikTok!', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                downloader.tiktok(url).then(async (videoMeta) => {
                    const filename = videoMeta.authorMeta.name + '.mp4'
                    const caps = `*Dados:*\nUsername: ${videoMeta.authorMeta.name} \nMusica: ${videoMeta.musicMeta.musicName} \nViews: ${videoMeta.playCount.toLocaleString()} \nLikes: ${videoMeta.diggCount.toLocaleString()} \nComentários: ${videoMeta.commentCount.toLocaleString()} \nComp.: ${videoMeta.shareCount.toLocaleString()} \nLegenda: ${videoMeta.text.trim() ? videoMeta.text : '-'}`
                    await client.sendFileFromUrl(from, videoMeta.url, filename, videoMeta.NoWaterMark ? caps : `⚠ Não foi possivel baixar sem a Marca D'Agua. \n\n${caps}`, '', id)
                }).catch(() => client.reply(from, '[🤷🏽‍♀️] Vish... Eu não sei porque mais não deu certo pra eu fazer isso!', id))
                break
                //
            case 'ytmp3':
                if (args.length == 0 || !is.Url(url) || !url.includes('youtu')) return client.reply(from, '[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#ytmp3 link_do_video*', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                try {
                    const ytmp3d = await axios.get(`http://st4rz.herokuapp.com/api/yta2?url=${encodeURIComponent(url)}`)
                    await client.sendFileFromUrl(from, `${ytmp3d.data.result}`, `${ytmp3d.data.title}.${ytmp3d.data.ext}`, `${ytmp3d.data.title}`, id)
                } catch (error) {
                    await client.reply(from, '[🤷🏽‍♀️] Vish... Deu tudo errado. Tente novamente mais tarde!', id)
                }
                break
                //
            case 'ytmp4':
                if (args.length == 0 || !is.Url(url) || !url.includes('youtu')) return client.reply(from, '[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#ytmp4 link_do_video*', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                try {
                    const ytmp4d = await axios.get(`http://st4rz.herokuapp.com/api/ytv2?url=${encodeURIComponent(url)}`)
                    await client.sendFileFromUrl(from, `${ytmp4d.data.result}`, `${ytmp4d.data.title}.${ytmp4d.data.ext}`, `${ytmp4d.data.title}`, id)
                } catch (error) {
                    await client.reply(from, '[🤷🏽‍♀️] Vish... Deu tudo errado. Tente novamente mais tarde!', id)
                }
                break
                //
            case 'facebook':
            case 'fb':
                if (args.length !== 1) return client.reply(from, '[🤦🏽‍♀️] Hey, você utilizou esse comando de forma errada. \nTente Utilizar: *#facebook link_do_video*', id)
                if (!is.Url(url) && !url.includes('facebook.com') || url.includes('fb.watch')) return client.reply(from, '[🤷🏽‍♀️] Parece que este Link não é do Facebook!', id)
                await client.reply(from, `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso... \nPode levar até 5min para o envio!`, id)
                try {
                        const fb = await axios.get(`https://mnazria.herokuapp.com/api/fbdownloadervideo?url=${encodeURIComponent(url)}`)
                        await client.sendFileFromUrl(from, `${fb.data.resultSD}`, 'video.mp4', '', id)
                    } catch (error) {
                        await client.reply(from, '[🤷🏽‍♀️] Vish... Deu tudo errado. Tente novamente mais tarde!', id)
                    }
                    break
                //
                //Outros
                //
            case 'covid':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Utilize: ${prefix}covid nome_pais \nObs: Nome do País deve ser em Inglês`, id)
                const country = body.slice(7)
                const response2 = await axios.get('https://coronavirus-19-api.herokuapp.com/countries/' + country + '/')
                const {
                    cases, todayCases, deaths, todayDeaths, active, recovered
                } = response2.data
                await client.sendText(from, '🌎️ Informações COVID-19 - *' + country + '* 🌍️\n\n✨️Total de Casos: ' + `${cases}` + '\n📆️Casos Hoje: ' + `${todayCases}` + '\n☣️Total de Mortes: ' + `${deaths}` + '\n☢️Mortes Hoje: ' + `${todayDeaths}` + '\n⛩️Casos Ativos: ' + `${active}` + '\n🩺Casos Recuperados: ' + `${recovered}` + '.')
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro, pais não localizado!', id)
                    })
                break
                //
            case 'cotacao':
                const response3 = await axios.get('https://economia.awesomeapi.com.br/all/USD-BRL,USDT-BRL,EUR-BRL,BTC-BRL')
                const {
                    USD, EUR, BTC, USDT
                } = response3.data
                await client.sendText(from, '*Cotação de Moedas - Atualiza a cada 30seg*' + '\n\nDolar Comercial: ' + '\n💵 _Compra: ' + `R$${USD.bid}_` + '\n💸 _Venda: ' + `R$${USD.ask}_` + '\n📈 _Variação: ' + `${USD.pctChange}%_` + '\n\nDolar Turismo: ' + '\n💵 _Compra: ' + `R$${USDT.bid}_` + '\n💸 _Venda: ' + `R$${USDT.ask}_` + '\n📈 _Variação: ' + `${USDT.pctChange}%_` + '\n\nEURO: ' + '\n💶 _Compra: ' + `R$${EUR.bid}_` + '\n💸 _Venda: ' + `R$${EUR.ask}_` + '\n📈 _Variação: ' + `${EUR.pctChange}%_` + '\n\nBitCoin: ' + '\n💳 _Compra: ' + `R$${BTC.bid}_` + '\n💸 _Venda: ' + `R$${BTC.ask}_` + '\n📈 _Variação: ' + `${BTC.pctChange}%_` + '.')
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro', id)
                    })
                break
                //
            case 'horoscopo':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Utilize: ${prefix}horoscopo data_nascimento\nEx: #horoscopo 29-01-2000`, id)
                const data_nascimento = args[0]
                const response5 = await axios.get(`http://babi.hefesto.io/${data_nascimento}/dia`)
                const {
                    signo, texto, autor, urlOrigem
                } = response5.data
                await client.sendText(from, '*Horóscopo do Signo:* ' + `${signo}` + `\n\n${texto.toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Aquário de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Áries de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Peixes de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Câncer de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Leão de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Virgem de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Gêmeos de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Touro de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Capricórnio de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Sagitário de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Escorpião de Barbara Abramo.', '').toString().replace('Saiba mais sobre saúde, bem-estar, amor, relacionamento, trabalho e dinheiro do seu signo na previsão mensal de Libra de Barbara Abramo.', '').toString().replace('Perfil da mulher de Áries', '\n\n *Perfil da mulher de Áries*\n').toString().replace('No amor e no sexo', '\n\n *No amor e no sexo*\n').toString().replace('No trabalho e no dinheiro', '\n\n *No trabalho e no dinheiro*\n').toString().replace('Na família e na amizade', '\n\n *Na família e na amizade*\n').toString().replace('Perfil da mulher de Aquário', '\n\n *Perfil da mulher de Aquário*\n').toString().replace('Perfil da mulher de Touro', '\n\n *Perfil da mulher de Touro*\n').toString().replace('Perfil da mulher de Gêmeos', '\n\n *Perfil da mulher de Gêmeos*\n').toString().replace('Perfil da mulher de Câncer', '\n\n *Perfil da mulher de Câncer*\n').toString().replace('Perfil da mulher de Leão', '\n\n *Perfil da mulher de Leão*\n').toString().replace('Perfil da mulher de Virgem', '\n\n *Perfil da mulher de Virgem*\n').toString().replace('Perfil da mulher de Libra', '\n\n *Perfil da mulher de Libra*\n').toString().replace('Perfil da mulher de Escorpião', '\n\n *Perfil da mulher de Escorpião*\n').toString().replace('Perfil da mulher de Sagitário', '\n\n *Perfil da mulher de Sagitário*\n').toString().replace('Perfil da mulher de Capricórnio', '\n\n *Perfil da mulher de Capricórnio*\n').toString().replace('Perfil da mulher de Peixes', '\n\n *Perfil da mulher de Peixes*\n').replace('        ', '').replace('       ', '').replace('   ', '')}` + '\n*Autor(a):* ' + `${autor}` + '\n\n*Fonte:* ' + `${urlOrigem}` + '')
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro!', id)
                    })
                break
                //
            case 'cep':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️]Utilize: ${prefix}cep 12345789 \nObs: Não coloque o simbolo "-"`, id)
                const CEPBody = body.slice(5)
                const response4 = await axios.get('https://cep.awesomeapi.com.br/json/' + CEPBody + '/')
                const {
                    cep, address, district, state, city, lat, lng, city_ibge, ddd
                } = response4.data
                await client.sendText(from, `*[Dados do CEP]*\n\n *CEP:* ${cep}\n *Logradouro:* ${address}\n *Bairro:* ${district}\n *Estado:* ${state} \n *Cidade:* ${city}\n *Cód IBGE:* ${city_ibge}\n *DDD:* ${ddd}\n`)
                await client.sendLocation(from, `${lat}`, `${lng}`, `${address}`)
                break
                //
            case 'rastrear':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️]Hey, você deve utilizar: ${prefix}rastrear codigo_encomenda`, id)
                if (isGroupMsg) return client.reply(from, '[🤦🏽‍♀️] Melhor não usar isso em grupos! Me chama no privado que eu te respondo!', id)
                const codigo_rastreio = args[0]
                if (codigo_rastreio.length == 13) {
                    const response7 = await axios.get('https://api.linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=' + codigo_rastreio + '')
                    let {
                        codigo,
                        servico,
                        quantidade,
                        eventos
                    } = response7.data
                    await client.sendText(from, `*Rastreio da Encomenda:* ${codigo} \n*Serviço:* ${servico}`)
                    var i;
                    for (i = 0; i < quantidade; i++) {
                        await client.sendText(from, `*Data:* ${eventos[i].data} - ${eventos[i].hora} \n*Local:* ${eventos[i].local}\n*Status:* ${eventos[i].status} \n\n*OBS:*\n` + (eventos[i].subStatus).toString().replace(',<span class="minhasImportacoes">Acesse o ambiente <a href="https://www.correios.com.br/encomendas-logistica/minhas-importacoes/minhas-importacoes" target="_blank">Minhas Importações</a></span>', '').toString().replace('<span class="minhasImportacoes">Acesse o ambiente <a href="https://www.correios.com.br/encomendas-logistica/minhas-importacoes/minhas-importacoes" target="_blank">Minhas Importações</a></span>', '').toString().replace(',Destino:', '\n*Destino:* ').toString().replace('Local:', '*Local:* ').toString().replace('Origem:', '*Origem:* ').toString().replace('- /', ''))
                    }
                    await client.sendText(from, `Para notificações e mais detalhes utilize o App: *MUAMBATOR*`)
                        .catch(() => {
                            client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro', id)
                        })
                } else {
                    client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro para buscar esse código!', id)
                }
                break
                //
            case 'imagens':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Pesquise Imagens no Pinterest: \n *${prefix}imagens [pesquisa]*\nEx: ${prefix}imagens carros`, id)
                const cariwall = body.slice(9)
                const hasilwall = await images.fdci(cariwall)
                client.sendFileFromUrl(from, hasilwall, '', '', id)
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro, nenhuma imagem localizada!', id)
                    })
                break
                //
                case 'imagine':
                    if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Crie imagens usando inteligencia artifical: \n *${prefix}imagine [prompt]*\n`, id)
                    const prompt = body.slice(10)
                    const promptx = await deepai.imagine(prompt)
                    client.sendFileFromUrl(from, promptx, '', '', id)
                        .catch(() => {
                            client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro, nenhum prompet recebido!', id)
                        })
                    break
                //
            case 'upimg':
            case 'uparimagem':
                if (isMedia && type === 'image' || isQuotedImage) {
                    const upimgoh = isQuotedImage ? quotedMsg : message
                    const mediaData = await decryptMedia(upimgoh, uaOverride)
                    const upImg = await uploadImages(mediaData, false)
                    await client.reply(from, `*OBS!* _Não use esse comando com fotos pessoais, aqui está sua imagem em nuvem._\n\n${upImg}`, id)
                        .catch(() => {
                            client.reply(from, 'O servidor negou o upload da foto, tente novamente dentro de uns minutos.', id)
                        })
                } else return client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro! Esse comando só aceita envio de imagens!', id)
                break
                case 'meme':
                    if (isMedia && type === 'image' && args.length >= 2 && q.includes('|') || isQuotedImage && args.length >= 2 && q.includes('|')) {
                        const top = arg.split('|')[0]
                        const bottom = arg.split('|')[1]
                        const memeData = isQuotedImage ? quotedMsg : message
                        const memeupm = await decryptMedia(memeData, uaOverride)
                        const memeUpl = await uploadImages(memeupm, false)
                        await client.sendFileFromUrl(from, `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${memeUpl}`, 'image.png', '', id)
                        .catch(() => { client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro!', id) })
                    } else return client.reply(from, `Isso deve ser usado digitando o comando e em seguida os argumentos, separando eles pelo |, exemplo, ${prefix}meme parte 1 | parte 2 | parte 3 e assim vai, nesse comando `, id)
                    break
                //
            case 'criador':
                await client.sendContact(from, '5517991766836@c.us')
                    .then(() => client.sendText(from, '👨🏻‍💻 Visite também meu site: igorsardinha.com'))
                break
                //
            case 'dado':
                const dice = Math.floor(Math.random() * 6) + 1
                await client.sendStickerfromUrl(from, 'https://www.random.org/dice/dice' + dice + '.png')
                break
            case 'moeda':
            case 'flip':
                const side = Math.floor(Math.random() * 2) + 1
                if (side == 1) {
                    client.sendStickerfromUrl(from, 'https://i.imgur.com/X97d8rO.png')
                } else {
                    client.sendStickerfromUrl(from, 'https://i.imgur.com/YCdONeq.png')
                }
                break
            case 'wa.me':
            case 'wame':
                await client.reply(from, `*Link do seu WhatsApp ${pushname}:*\n\n*wa.me/${sender.id.replace(/[@c.us]/g, '')}*\n\n*or*\n\n*api.whatsapp.com/send?phone=${sender.id.replace(/[@c.us]/g, '')}*`)
                break
            case 'letra':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Você usou esse comando do jeito errado! Utilize: ${prefix}letra nome da musica`, id)
                const lagu = body.slice(7)
                console.log(lagu)
                const lirik = await rugaapi.liriklagu(lagu)
                client.sendText(from, lirik)
                break
                //
            case 'png':
            case 'nobg':
            case 'removebg':
            case 'recorte':
                if (isMedia && type === 'image') {
                    try {
                        client.reply(from, '[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...', id)
                        var mediaData = await decryptMedia(message, uaOverride)
                        var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                        var base64img = imageBase64
                        var outFile = './media/img/noBg.png' //
                        var result = await removeBackgroundFromImageBase64({
                            base64img,
                            apiKey: 'H1Kc6wdx2EqewzcUj9VERgUn',
                            size: 'auto',
                            type: 'auto',
                            outFile
                        })
                        await fs.writeFile(outFile, result.base64img)
                        await client.sendImage(from, `data:${mimetype};base64,${result.base64img}`)
                    } catch (err) {
                        console.log(err)
                        client.reply(from, '[🙍🏽‍♀️] Vish... Eu não sei porque mais não deu certo pra eu fazer isso!', id)
                    }
                } else {
                    client.reply(from, '[🤷🏽‍♀️] Me manda uma imagem com a legenda *#png* ou responda uma imagem com o texto *#png*.', id)
                }
                break
                //
            case 'encurtar':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Utilize: ${prefix}encurtar <url>`, id)
                const shortlink = await urlShortener(args[0])
                await client.reply(from, shortlink)
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro!', id)
                    })
                break
            case 'ip':
                if (args.length !== 1) return client.reply(from, '[🤷🏽‍♀️] Informe um IPV4 (ex: #ip 8.8.8.8).', id)
                const ip = await axios.get(`http://ipwhois.app/json/${encodeURIComponent(body.slice(4))}`)
                if (ip.data.latitude == undefined) return client.reply(from, '[🙍🏽‍♀️] Nenhum informação localizada.', id)
                await client.reply(from, `*[Dados do IP]*\n *IP:* ${ip.data.ip}\n *Tipo:* ${ip.data.type}\n *Região:* ${ip.data.region}\n *Cidade:* ${ip.data.city}\n *Latitude:* ${ip.data.latitude}\n *Longitude:* ${ip.data.longitude}\n *Provedor:* ${ip.data.isp}\n *Continente:* ${ip.data.continent}\n *Sigla do continente:* ${ip.data.continent_code}\n *País:* ${ip.data.country}\n *Sigla do País:* ${ip.data.country_code}\n *Capital do País:* ${ip.data.country_capital}\n *DDI:* ${ip.data.country_phone}\n *Países Vizinhos:* ${ip.data.country_neighbours}\n *Fuso Horário:* ${ip.data.timezone} ${ip.data.timezone_name} ${ip.data.timezone_gmt}\n *Moeda:* ${ip.data.currency}\n *Sigla da Moeda:* ${ip.data.currency_code}\n`, id)
                await client.reply(from, 'Buscando o local no Google Maps. \nAguarde +/- 5seg...', id)
                const browserip = await puppeteer.launch({
                    headless: true,
                    defaultViewport: null,
                    args: ['--start-maximized']
                })
                const pageip = await browserip.newPage()
                await pageip.goto(`http://www.google.com/maps?layer=c&cbll=${ip.data.latitude},${ip.data.longitude}`, {
                    waitUntil: "networkidle2"
                }).then(async () => {
                    await sleep(5000)
                    await client.sendLocation(from, `${ip.data.latitude}`, `${ip.data.longitude}`, '')
                    await pageip.screenshot({
                        path: `./media/img/${user.replace('@c.us', '')}ip.png`
                    })
                    browserip.close()
                })
                await client.sendFile(from, `./media/img/${user.replace('@c.us', '')}ip.png`, 'ip.png', `Talvez seja aqui! 📍\n *Google Maps:* http://www.google.com/maps/place/${ip.data.latitude},${ip.data.longitude}`, id)
                fs.unlinkSync(`./media/img/${user.replace('@c.us', '')}ip.png`)
                break
                // Por Tio das Trevas, updates KillovSky
            case 'decode':
                if (args.length == 0) return client.reply(from, '[🤷🏽‍♀️] Envie um código binário para decodar', id)
                const dbin = await axios.get(`https://some-random-api.ml/binary?decode=${encodeURIComponent(body.slice(8))}`)
                await client.reply(from, `*🤖1️⃣  =*\n\n${body.slice(8)}\n\n *= 📓✏️*\n\n${dbin.data.text}`, id)
                break

                // Por Tio das Trevas, updates KillovSky
            case 'encode':
                if (args.length == 0) return kill.reply(from, '[🤷🏽‍♀️] Envie um texto para encodar', id)
                const cbin = await axios.get(`https://some-random-api.ml/binary?text=${encodeURIComponent(body.slice(8))}`)
                await client.reply(from, `*📓✏️ → *\n\n${body.slice(8)}\n\n*🤖1️⃣  → *\n\n${cbin.data.binary}`, id)
                break
            case 'say':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Utilize:\n${prefix}say [mensagem]`)
                if (!isGroupMsg) return client.reply(from, '[🤷🏽‍♀️] *Atenção!* \n\nEsse comando só funciona em Grupos.', id)
                let sayText = `${body.slice(5)}`
                await client.sendText(from, sayText)
                break
                //
                case 'github':
                    if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Utilize:\n${prefix}github [user]`, id)
                    await client.reply(from,  `[👩🏽‍💻] Paraê... Eu preciso pensar um pouco para fazer isso...`, id)
                    const gitData = await axios.get(`https://api.github.com/users/${args[0]}`)
                    const siteAdmin = (gitData.data.site_admin == false) ? 'Não' : gitData.data.site_admin
                    const companY = (gitData.data.company == null) ? 'Não' : gitData.data.company
                    const bloG = (gitData.data.blog == "") ? 'Não' : gitData.data.blog
                    const emaiL = (gitData.data.email == null) ? 'Não' : gitData.data.email
                    const tramPar = (gitData.data.hireable == null) ? 'Não' : gitData.data.hireable
                    if (gitData.data.message == 'Not Found') return client.reply(from, '[🙍🏽‍♀️] Ocorreu um Erro!', id)
                    await client.sendFileFromUrl(from, `${gitData.data.avatar_url}`, 'avatar.png', `*[CONSULTA GITHUB]*\n\n *Username:* ${gitData.data.name}\n *ID:* ${gitData.data.id}\n *Node_ID:* ${gitData.data.node_id}\n *URL:* ${gitData.data.html_url}\n *Local:* ${gitData.data.location}\n *Bio:* ${gitData.data.bio}\n *Twitter:* ${gitData.data.twitter_username}\n *Seguidores:* ${gitData.data.followers}\n *Seguindo:* ${gitData.data.following}\n *Criado as:* ${gitData.data.created_at}\n *Update:* ${gitData.data.updated_at}\n *Procura trabalho:* ${tramPar}\n *Site:* ${bloG}\n *Repositorios:* ${gitData.data.public_repos}\n *Admin de Site:* ${siteAdmin}\n *Tipo:* ${gitData.data.type}\n *Empresa:* ${companY}\n *Email:* ${emaiL}`, id)
                    break
                //
            case 'traduzir':
            case 'translate':
                if (args.length != 1) return client.reply(from, `Responda uma Mensagem com o comando: #traduzir código_idioma. Ex: #traduzir pt`, id)
                if (!quotedMsg) return client.reply(from, `Responda uma Mensagem com o comando: #traduzir código_idioma. Ex: #traduzir pt`, id)
                const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
                translate(quoteText, args[0])
                    .then((result) => client.sendText(from, result))
                    .catch(() => client.sendText(from, 'Erro. Código do Idioma Inválido'))
                break
            case 'ocr':
                if (isMedia && type == "image" || isQuotedImage) {
                    var mediaData = await decryptMedia(message, uaOverride)
                    client.reply(from, '[👩🏽‍💻] Paraê... Estou carregando sua imagem!', id)
                    var imageHash = `./media/ocrimg.png`
                    await fs.writeFileSync(imageHash, mediaData)

                    var options = {
                        apikey: '4ca6371fa188957',
                        language: 'por', // Português
                        isOverlayRequired: true
                    };

                    // Image file to upload
                    const imageFilePath = imageHash;

                    // Run and wait the result
                    ocrSpaceApi.parseImageFromLocalFile(imageFilePath, options)
                        .then(function (parsedResult) {
                            client.sendText(from, '*Resultado do OCR:*\n' + parsedResult.parsedText)
                        }).catch(function (err) {
                            console.log('ERRO:', err);
                        });
                } else {
                    client.reply(from, `[🤷🏽‍♀️] Me manda uma imagem com a legenda *${prefix}ocr*`, id)
                }
                break
                //
            case 'tod':
            case 'vxd':
                client.reply(from, '*Jogo de Verdade ou Desafio*\nPara jogar informe: *#verdade* ou *#desafio*\nObs: Esse jogo pode ser um pouco "pesado"', id)
                break
            case 'verdade':
            case 'v':
            case 'vdd':
            case 'truth':
                fetch('https://igorsardinhared.000webhostapp.com//isis-bot/verdades.txt')
                    .then(res => res.text())
                    .then(body => {
                        let truthx = body.split('\n')
                        let truthz = truthx[Math.floor(Math.random() * truthx.length)]
                        client.reply(from, truthz, id)
                    })
                    .catch(() => {
                        client.reply(from, 'Ops... Ocorreu um erro!', id)
                    })
                break
            case 'desafio':
            case 'd':
            case 'dsf':
            case 'dare':
                fetch('https://igorsardinhared.000webhostapp.com//isis-bot/desafios.txt')
                    .then(res => res.text())
                    .then(body => {
                        let darex = body.split('\n')
                        let darez = darex[Math.floor(Math.random() * darex.length)]
                        client.reply(from, darez, id)
                    })
                    .catch(() => {
                        client.reply(from, 'Ops... Ocorreu um erro!', id)
                    })
                break
                ///////////
            case 'eununca':
                fetch('https://igorsardinhared.000webhostapp.com//isis-bot/eununca.txt')
                    .then(res => res.text())
                    .then(body => {
                        let truthx = body.split('\n')
                        let truthz = truthx[Math.floor(Math.random() * truthx.length)]
                        client.reply(from, truthz, id)
                    })
                    .catch(() => {
                        client.reply(from, 'Ops... Ocorreu um erro!', id)
                    })
                break
                /////////////
            case 'cantadas':
                fetch('https://pastebin.com/raw/KqZYu3Av')
                    .then(res => res.text())
                    .then(body => {
                        let darex = body.split('\n')
                        let darez = darex[Math.floor(Math.random() * darex.length)]
                        client.reply(from, darez, id)
                    })
                    .catch(() => {
                        client.reply(from, 'Ops... Ocorreu um erro!', id)
                    })
                break
                /////////////////////
            case 'neon':
                let neontext = `${body.slice(5)}`
                if (!neontext.includes('|')) return await client.reply(from, "Informe: #neon Linha 1 | Linha 2", id)
                const atasnya = neontext.substring(0, neontext.indexOf('|') - 1)
                const tengahnya = neontext.substring(neontext.indexOf('|') + 2, neontext.lastIndexOf('|') - 1)
                const bawahnya = neontext.substring(neontext.lastIndexOf('|') + 2)
                await client.reply(from, "Por favor aguarde...", id)
                const neonurl = `http://docs-jojo.herokuapp.com/api/neon?text1=${atasnya}&text2=${tengahnya}&text3=${bawahnya}`
                await client.sendFileFromUrl(from, neonurl, 'imagem.png', '', id)
                console.log('Success creating image!')
                break
                ///////
            case 'wiki':
                if (args.length == 0) return client.reply(from, `[🤷🏽‍♀️] Pesquise na WikiPédia\nUtilize: ${prefix}wiki pesquisa`, id)
                const wikiBusca = body.slice(5)
                const responseWiki = `https://pt.wikipedia.org/api/rest_v1/page/pdf/${wikiBusca}/a4`
                await client.sendText(from, '[👩🏽] Eu achei isso no WikiPédia:')
                await client.sendFileFromUrl(from, responseWiki, wikiBusca)
                    .catch(() => {
                        client.reply(from, '[🙍🏽‍♀️] Ocorreu um erro', id)
                    })
                break
                //
            case 'calc':
                const operacao = args.join(' ')
                await client.reply(from, `*「CALCULADORA」*\n\n${operacao} = ${mathjs.evaluate(operacao)}`, id)
                break
                //
            case 'tts':
                if (args.length <= 1) return client.reply(from, 'Hey! Utilize #tts idioma texto', id)
                try {
                    const dataText = body.slice(8)
                    var langtts = args[0]
                    if (args[0] == 'br') langtts = 'pt-br'
                    var idptt = tts(langtts)
                    idptt.save(`./media/tts/resTTS.mp3`, dataText, async () => {
                        await client.sendPtt(from, `./media/tts/resTTS.mp3`, id)
                    })
                } catch (error) {
                    await client.reply(from, `Você usou uma lingua invalida, de uma olhada no ${prefix}idiomas e tente digitar novamente!`, id)
                }
                break

            case 'idiomas':
                await client.sendText(from, `*[IDIOMAS]* \n\n 🇿🇦 'af' → 'Africano'  \n 🇸🇦 'ar' → 'Arabico'  \n 🇦🇺 'au' → 'Inglês da Australia'  \n 🇧🇷 'br' → 'Português do Brasil'  \n 🇦🇩 'ca' → 'Catalã (Catalonia)'  \n 🇨🇳 'cn' → 'Chinês (Mandarin/China)'  \n 🇨🇿 'cs' → 'Tcheca'  \n 🏴󠁧󠁢󠁷󠁬󠁳󠁿 'cy' → 'Galês'  \n 🇩🇰 'da' → 'Dinamarquês'  \n 🇩🇪 'de' → 'Germanico/Alemão'  \n 🇬🇷 'el' → 'Grega'  \n 🇺🇸 'en' → 'Inglês'  \n 🚩 'eo' → 'Esperanto'  \n 🇪🇸 'es' → 'Espanhol'  \n 🇫🇮 'fi' → 'Finlandês'  \n 🇫🇷 'fr' → 'Francês'  \n 🇮🇳 'hi' → 'Hindi'  \n 🚩 'hr' → 'Croácio'  \n 🚩 'ht' → 'Haitiano'  \n 🚩 'hu' → 'Húngaro'  \n 🚩 'hy' → 'Armenico'  \n 🚩 'id' → 'Indonesio'  \n 🚩 'is' → 'islandês'  \n 🚩 'it' → 'Italiano'  \n 🚩 'ja' → 'Japonês'  \n 🚩 'ko' → 'Coreano'  \n 🚩 'la' → 'Latim'  \n 🚩 'lv' → 'Letonês'  \n 🚩 'mk' → 'Macedónio'  \n 🚩 'nl' → 'Holandês'  \n 🚩 'no' → 'Norueguês'  \n 🚩 'pl' → 'Polonês'  \n 🚩 'pt' → 'Português de Portugal'  \n 🚩 'ro' → 'Romeno'  \n 🚩 'ru' → 'Russo'  \n 🚩 'sk' → 'Eslovaco'  \n 🚩 'sp' → 'Espanhol da Espanha'  \n 🚩 'sq' → 'Albanês'  \n 🚩 'sr' → 'Servia'  \n 🚩 'su' → 'Espanhol dos Estados Unidos'  \n 🚩 'sv' → 'Sueco'  \n 🚩 'sw' → 'Suaíli'  \n 🚩 'ta' → 'Tamil'  \n 🚩 'th' → 'Thailandês'  \n 🚩 'tr' → 'Turco'  \n 🚩 'tw' → 'Chinês (Mandarin/Taiwan)'  \n 🚩 'uk' → 'Inglês do Reino Unido)'  \n 🚩 'us' → 'Inglês dos Estados Unidos'  \n 🚩 'vi' → 'Vietnamita'  \n 🚩 'yu' → 'Chinês (Cantonesa)'  \n 🚩 'zh' → 'Chinês\n`, id)
                break
                //
            case 'kiss':
            case 'beijo':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                try {
                    if (isMedia && type === 'image' && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(message, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.kiss(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_kiss.png`)
                                await client.sendFile(from, `${sender.id}_kiss.png`, `${sender.id}_kiss.png`, 'Pronto, se você quiser uma foto da pessoa que deseja beijar, envie uma foto com a legenda #kiss', id)
                                fs.unlinkSync(`${sender.id}_kiss.png`)
                            })
                    } else if (quotedMsg && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(quotedMsg, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.kiss(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_kiss.png`)
                                await client.sendFile(from, `${sender.id}_kiss.png`, `${sender.id}_kiss.png`, '', id)
                                fs.unlinkSync(`${sender.id}_kiss.png`)
                            })
                    } else if (mentionedJidList.length !== 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await client.getProfilePicFromServer(mentionedJidList[0])
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        if (ppSecond === undefined) {
                            var pp2nd = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var pp2nd = ppSecond
                        }
                        canvas.Canvas.kiss(ppFirst, pp2nd)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_kiss.png`)
                                await client.sendFile(from, `${sender.id}_kiss.png`, `${sender.id}_kiss.png`, '', id)
                                fs.unlinkSync(`${sender.id}_kiss.png`)
                            })
                    }
                } catch (err) {
                    await client.reply(from, `Ocorreu um erro ao usar esse comando!`, id)
                }
                break
                //
            case 'spank':
            case 'bater':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                try {
                    if (isMedia && type === 'image' && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(message, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.spank(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_spank.png`)
                                await client.sendFile(from, `${sender.id}_spank.png`, `${sender.id}_spank.png`, '', id)
                                fs.unlinkSync(`${sender.id}_spank.png`)
                            })
                    } else if (quotedMsg && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(quotedMsg, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.spank(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_spank.png`)
                                await client.sendFile(from, `${sender.id}_spank.png`, `${sender.id}_spank.png`, '', id)
                                fs.unlinkSync(`${sender.id}_spank.png`)
                            })
                    } else if (mentionedJidList.length !== 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await client.getProfilePicFromServer(mentionedJidList[0])
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        if (ppSecond === undefined) {
                            var pp2nd = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var pp2nd = ppSecond
                        }
                        canvas.Canvas.spank(ppFirst, pp2nd)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_spank.png`)
                                await client.sendFile(from, `${sender.id}_spank.png`, `${sender.id}_spank.png`, '', id)
                                fs.unlinkSync(`${sender.id}_spank.png`)
                            })
                    }
                } catch (err) {
                    await client.reply(from, `Ocorreu um erro ao usar esse comando!`, id)
                }
                break
                //
            case 'slap':
            case 'tapa':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                try {
                    if (isMedia && type === 'image' && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(message, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.slap(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_slap.png`)
                                await client.sendFile(from, `${sender.id}_slap.png`, `${sender.id}_slap.png`, '', id)
                                fs.unlinkSync(`${sender.id}_slap.png`)
                            })
                    } else if (quotedMsg && mentionedJidList.length == 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await decryptMedia(quotedMsg, uaOverride)
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        canvas.Canvas.slap(ppFirst, ppSecond)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_slap.png`)
                                await client.sendFile(from, `${sender.id}_slap.png`, `${sender.id}_slap.png`, '', id)
                                fs.unlinkSync(`${sender.id}_slap.png`)
                            })
                    } else if (mentionedJidList.length !== 0) {
                        const ppRaw = await client.getProfilePicFromServer(sender.id)
                        const ppSecond = await client.getProfilePicFromServer(mentionedJidList[0])
                        if (ppRaw === undefined) {
                            var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var ppFirst = ppRaw
                        }
                        if (ppSecond === undefined) {
                            var pp2nd = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                        } else {
                            var pp2nd = ppSecond
                        }
                        canvas.Canvas.slap(ppFirst, pp2nd)
                            .then(async (buffer) => {
                                canvas.write(buffer, `${sender.id}_slap.png`)
                                await client.sendFile(from, `${sender.id}_slap.png`, `${sender.id}_slap.png`, '', id)
                                fs.unlinkSync(`${sender.id}_slap.png`)
                            })
                    }
                } catch (err) {
                    await client.reply(from, `Ocorreu um erro ao usar esse comando!`, id)
                }
                break
            case 'jail':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                const ppPicture = await client.getProfilePicFromServer(mentionedJidList[0])
                if (ppPicture === undefined) {
                    var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                } else {
                    var ppFirst = ppPicture
                }
                canvas.Canvas.jail(ppFirst)
                    .then(async (buffer) => {
                        canvas.write(buffer, `${sender.id}_jail.png`)
                        await client.sendFile(from, `${sender.id}_jail.png`, `${sender.id}_jail.png`, '', id)
                        fs.unlinkSync(`${sender.id}_jail.png`)
                    })
                break
            case 'rip':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                const ppPicture2 = await client.getProfilePicFromServer(mentionedJidList[0])
                if (ppPicture2 === undefined) {
                    var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                } else {
                    var ppFirst = ppPicture2
                }
                canvas.Canvas.rip(ppFirst)
                    .then(async (buffer) => {
                        canvas.write(buffer, `${sender.id}_rip.png`)
                        await client.sendFile(from, `${sender.id}_rip.png`, `${sender.id}_rip.png`, '', id)
                        fs.unlinkSync(`${sender.id}_rip.png`)
                    })
                break
            case 'facepalm':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                const ppPicture5 = await client.getProfilePicFromServer(mentionedJidList[0])
                if (ppPicture5 === undefined) {
                    var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                } else {
                    var ppFirst = ppPicture5
                }
                canvas.Canvas.facepalm(ppFirst)
                    .then(async (buffer) => {
                        canvas.write(buffer, `${sender.id}_facepalm.png`)
                        await client.sendFile(from, `${sender.id}_facepalm.png`, `${sender.id}_facepalm.png`, '', id)
                        fs.unlinkSync(`${sender.id}_facepalm.png`)
                    })
                break
            case 'beautiful':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                const ppPicture4 = await client.getProfilePicFromServer(mentionedJidList[0])
                if (ppPicture4 === undefined) {
                    var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                } else {
                    var ppFirst = ppPicture4
                }
                canvas.Canvas.beautiful(ppFirst)
                    .then(async (buffer) => {
                        canvas.write(buffer, `${sender.id}_beautiful.png`)
                        await client.sendFile(from, `${sender.id}_beautiful.png`, `${sender.id}_beautiful.png`, '', id)
                        fs.unlinkSync(`${sender.id}_beautiful.png`)
                    })
                break
            case 'wanted':
                if (!isGroupMsg) return client.reply(from, "Comando somente para ser usado em grupos!")
                const ppPicture3 = await client.getProfilePicFromServer(mentionedJidList[0])
                if (ppPicture3 === undefined) {
                    var ppFirst = 'https://telegra.ph/file/18da304b647f38c315abb.jpg'
                } else {
                    var ppFirst = ppPicture3
                }
                canvas.Canvas.wanted(ppFirst)
                    .then(async (buffer) => {
                        canvas.write(buffer, `${sender.id}_wanted.png`)
                        await client.sendFile(from, `${sender.id}_wanted.png`, `${sender.id}_wanted.png`, '', id)
                        fs.unlinkSync(`${sender.id}_wanted.png`)
                    })
                break
            case 'texto3d':
                if (args.length == 0) return client.reply(from, `Crie um texto 3D: #texto3d texto`, id)
                await client.reply(from, `Aguarde um momento...`, id)
                console.log('Creating text3d text...')
                const ltext3d = q
                await client.sendFileFromUrl(from, `https://docs-jojo.herokuapp.com/api/text3d?text=${ltext3d}`, 'text.png', null, null, true, false, false)
                    .then(() => console.log('Success creting image!'))
                    .catch(async (err) => {
                        console.error(err)
                        await client.reply(from, `Erro!`, id)
                    })
                break
            case 'stalkig':
            case 'stalkear':
                if (args.length == 0) return client.reply(from, 'Você precisa informar o nome do usuário que quer procurar!', id)
                const ig = await axios.get(`https://docs-jojo.herokuapp.com/api/stalk?username=${q}`)
                const stkig = JSON.stringify(ig.data)
                if (stkig == '{}') return client.reply(from, '💔️ - Sinto muito, não encontrei resultados para o comando...', id)
                await client.sendFileFromUrl(from, `${stkig.graphql.user.profile_pic_url}`, ``, `Username: *${stkig.graphql.user.username}*\n\nBiografia: ${stkig.graphql.user.biography}\nSeguidores: ${stkig.graphql.user.edge_followed_by.count}\nSeguindo: ${stkig.graphql.user.edge_follow.count}\nVerificada: ${stkig.graphql.user.is_verified}`, id)
                break
                //
            case 'qrread':
                if (args.length !== 1) return client.reply(from, `Para utilizar o leitor de Qr-Code envie a imagem do QR-Code para o site: https://imgur.com/ e digite #qrread url.`, id)
                client.reply(from, `Aguarde um instante...`, id);
                rugaapi.qrread(args[0])
                    .then(async (res) => {
                        await client.reply(from, `${res}`, id)
                    })
                break
            case 'qrcode':
                if (args.length !== 2) return client.reply(from, `Digite: #qrcode palavra/link tamanho(100 á 500)`, id)
                client.reply(from, `Aguarde um instante...`, id);
                rugaapi.qrcode(args[0], args[1])
                    .then(async (res) => {
                        await client.sendFileFromUrl(from, `${res}`, id)
                    })
                break
                //
                case 'chatgpt':
                    if (args.length == 0) return client.reply(from, `Utilize:\n${prefix}chatgpt [mensagem]`)
                    let text = body.slice(7);
                    client.reply(from, `Aguarde um instante...`, id);
                    chatgpt.chatgpt(text)
                    .then(async (res) => {
                        await client.reply(from, `${res}`, id)
                    })
                    break
                //
                case 'cnpj':
                    if (args.length == 1) {
                        const cnpj = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${encodeURIComponent(q)}`)
                        if (cnpj.data.status == 'ERROR') return client.reply(from, cnpj.data.message, id)
                        await client.reply(from, `*[DADOS DA EMPRESA]*\n *CNPJ:* ${cnpj.data.cnpj}\n *Tipo:* ${cnpj.data.tipo}\n *Nome:* ${cnpj.data.nome}\n *Região:* ${cnpj.data.uf}\n *Telefone:* ${cnpj.data.telefone}\n *Situação:* ${cnpj.data.situacao}\n *Bairro:* ${cnpj.data.bairro}\n *Logradouro:* ${cnpj.data.logradouro}\n *CEP:* ${cnpj.data.cep}\n *Casa N°:* ${cnpj.data.numero}\n *Municipio:* ${cnpj.data.municipio}\n *Abertura:* ${cnpj.data.abertura}\n *Fantasia:* ${cnpj.data.fantasia}\n *Jurisdição:* ${cnpj.data.natureza_juridica}\n *Capital Social:* R$${cnpj.data.capital_social}\n *Porte:* ${cnpj.data.porte}\n `, id)
                    } else return client.reply(from, 'Especifique um CNPJ sem os traços e pontos.', id)
                    break
                //Grupos
                case 'capagrupo':
                    if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                    if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                    if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                    if (isMedia && type == 'image' || isQuotedImage) {
                        const dataMedia = isQuotedImage ? quotedMsg : message
                        const mediaData = await decryptMedia(dataMedia, uaOverride)
                        const picgp = await client.getProfilePicFromServer(groupId)
                        if (picgp == undefined) { var backup = errorurl } else { var backup = picgp }
                        await client.sendFileFromUrl(from, backup, 'group.png', 'Backup', id)
                        await client.setGroupIcon(groupId, `data:${mimetype};base64,${mediaData.toString('base64')}`)
                    } else if (args.length == 1) {
                        if (!is.Url(url)) { await client.reply(from, 'Envie um link para setar como capa do grupo!', id) }
                        const picgpo = await client.getProfilePicFromServer(groupId)
                        if (picgpo == undefined) { var back = errorurl } else { var back = picgpo }
                        await client.sendFileFromUrl(from, back, 'group.png', 'Backup', id)
                        await client.setGroupIconByUrl(groupId, url).then((r) => (!r && r !== undefined)
                        ? client.reply(from, 'Falha ao setar pois o que você enviou não é um link!', id) : client.reply(from, 'Capa definida com sucesso!', id))
                    } else return client.reply(from, 'Apenas imagens são aceitas para capa do grupo!', id)
                    break
                case 'revogar':
                    if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                    if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                    if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                    await client.revokeGroupInviteLink(groupId).then(() => client.reply(from, '\n*ATENÇÃO!* O link do grupo foi revogado pela ISIS.\n', id))
                    break
                case 'mutar':
                    if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                    if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                    if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                    if (args.length !== 1) return client.reply(from, 'Atenção! \nInforme on ou off', id)
                    if (args[0] == 'on') {
                        await client.setGroupToAdminsOnly(groupId, true).then(() => client.sendText(from, 'O grupo foi mutado, e agora apenas ADMs  podem falar.'))
                    } else if (args[0] == 'off') {
                        await client.setGroupToAdminsOnly(groupId, false).then(() => client.sendText(from, 'O grupo foi desmutado, e agora todos  podem falar.'))
                    } else return client.reply(from, 'Só funciona se usar on ou off.', id)
                    break
            case 'add':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (args.length !== 1) return client.reply(from, `Utilize *#add numero*`, id)
                try {
                    await client.addParticipant(from, `${args[0]}@c.us`)
                        .then(() => client.reply(from, 'Olá, seja bem vindo.', id))
                } catch {
                    client.reply(from, 'Não foi possível adicionar esse usuário.', id)
                }
                break
                //
            case 'kick':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (mentionedJidList.length === 0) return client.reply(from, 'Utilize *kick @id*', id)
                if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Você não pode usar esse comando no BOT!', id)
                await client.sendTextWithMentions(from, `O membro ${mentionedJidList.map(x => `@${x.replace('@c.us', '')} foi removido.`).join('')}`)
                for (let i = 0; i < mentionedJidList.length; i++) {
                    if (groupAdmins.includes(mentionedJidList[i])) return await client.sendText(from, 'Você não pode remover um Admin.')
                    await client.removeParticipant(groupId, mentionedJidList[i])
                }
                break
                //
            case 'kickall': //mengeluarkan semua member
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isOwner) return client.reply(from, 'Esse comando somente funciona para o dono do BOT!', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                const allMem = await client.getGroupMembers(groupId)
                for (let i = 0; i < allMem.length; i++) {
                    if (groupAdmins.includes(allMem[i].id)) {

                    } else {
                        await client.removeParticipant(groupId, allMem[i].id)
                    }
                }
                client.reply(from, 'Todos os membros removidos', id)
                break
            case 'promote':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (mentionedJidList.length != 1) return client.reply(from, 'Você só pode citar um usuário.', id)
                if (groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'MO BOT não pode ser promovido.', id)
                if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Formato inválido, tente novamente!', id)
                await client.promoteParticipant(groupId, mentionedJidList[0])
                await client.sendTextWithMentions(from, `O Usuário @${mentionedJidList[0].replace('@c.us', '')} se tornou Admin.`)
                break
                //
            case 'demote':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (mentionedJidList.length !== 1) return client.reply(from, 'Você só pode citar um usuário.', id)
                if (!groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'O Usuário citado não é um Admin', id)
                if (mentionedJidList[0] === botNumber) return await client.reply(from, 'O BOT não pode ser Demotado.', id)
                await client.demoteParticipant(groupId, mentionedJidList[0])
                await client.sendTextWithMentions(from, `O Usuário @${mentionedJidList[0].replace('@c.us', '')} não é mais Admin.`)
                break
                //
            case 'tagall':
                if (args.length == 0) return client.reply(from, `Utilize:\n${prefix}tagall [mensagem]`)
                if (!isGroupMsg) return client.reply(from, 'Comando somente para ser usado em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                    let hehe = `@${sender.id}, escreveu:\n ${q}\n\n`
                    const groupMem = await client.getGroupMembers(groupId)
                    for (let i = 0; i < groupMem.length; i++) {
                        hehe += ` *-* @${groupMem[i].id.replace(/@c.us/g, '')}\n`
                        }
                    hehe += '\n*[ENVIADO PELA ISIS BOT]*'
                    await sleep(2000)
                    await client.sendTextWithMentions(from, hehe)
                break
            case 'antilink':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isGroupAdmins) return client.reply(from, 'Esse comando só pode ser usado por Admins do Grupo.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (args[0] == 'on') {
                    var cek = antilink.includes(chatId);
                    if (cek) {
                        return client.reply(from, '*Sistema Anti-Link* \n Esse sistema já está ativo no grupo!', id) //if number already exists on database
                    } else {
                        antilink.push(chatId)
                        fs.writeFileSync('./antilink.json', JSON.stringify(antilink))
                        client.reply(from, '*[Sistema Anti-Link]* Foi ativado! Cada membro do grupo que enviar uma mensagem contendo um link de grupo será expulso grupo!', id)
                    }
                } else if (args[0] == 'off') {
                    var cek = antilink.includes(chatId);
                    if (!cek) {
                        return client.reply(from, '*Sistema Anti-Link* \n Esse Sistema já está Desativado no grupo!', id) //if number already exists on database
                    } else {
                        let nixx = antilink.indexOf(chatId)
                        antilink.splice(nixx, 1)
                        fs.writeFileSync('./antilink.json', JSON.stringify(antilink))
                        client.reply(from, '*[Sistema Anti-Link]* Foi desativado, agora se receber um lnk eu não vou mais remover o usuário.\n', id)
                    }
                } else {
                    client.reply(from, `Para usar o AntiLink utilize:\n #antilink on \nou\n #antilink off`, id)
                }
                break
                //
                //
                //
            case 'welcome':
                if (!isGroupMsg) return client.reply(from, '[👩🏽] Esse comando só pode ser usado em um grupo!', id)
                if (!isGroupAdmins) return client.reply(from, '[👩🏽] Esse comando só pode ser usado por Admins!', id)
                if (args.length === 0) return client.reply(from, 'Informe ON/OFF', id)
                if (args[0] === 'ON') {
                    welkom.push(chat.id)
                    fs.writeFileSync('../../lib/welcome.json', JSON.stringify(welkom))
                    client.reply(from, '[👩🏽] As mensagens de bem-vindo foram ATIVADAS!', id)
                } else if (args[0] === 'OFF') {
                    welkom.splice(chat.id, 1)
                    fs.writeFileSync('../../lib/welcome.json', JSON.stringify(welkom))
                    client.reply(from, '[👩🏽] As mensagens de bem-vindo foram DESATIVADAS!', id)
                } else {
                    client.reply(from, 'Informe ON ou OFF', id)
                }
                break
            case 'admins':
            case 'adm':
                if (!isGroupMsg) return client.reply(from, 'Comando somente para ser usado em Grupos!', id)
                let mimin = '*Admins:* \n'
                for (let admon of groupAdmins) {
                    mimin += `@${admon.replace(/@c.us/g, '')}\n`
                }
                await client.sendTextWithMentions(from, mimin)
                break
                //   
            case 'link':
            case 'linkgrupo':
                if (isGroupMsg) {
                    if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                    const inviteLink = await client.getGroupInviteLink(groupId);
                    client.sendLinkWithAutoPreview(from, inviteLink, `\nLink do Grupo: *${name}*`)
                } else {
                    client.reply(from, 'Este comando só pode ser usado em grupos!', id)
                }
                break
                //DONO DO BOT
            case 'bc':
                if (!isOwner) return client.reply(from, 'Disponível somente para o criador do BOT!', id)
                if (args.length == 0) return client.reply(from, `Utilize:\n${prefix}bc [mensagem]`)
                let msg = body.slice(4)
                const chatz = await client.getAllChatIds()
                for (let idk of chatz) {
                    var cvk = await client.getChatById(idk)
                    if (!cvk.isReadOnly) client.sendText(idk, `*[MENSAGEM GLOBAL]*\n\n${msg}`)
                    if (cvk.isReadOnly) client.sendText(idk, `*[MENSAGEM GLOBAL]*\n\n${msg}`)
                }
                client.reply(from, 'Broadcast Enviado para todos os Chats Disponíveis!', id)
                break
                //
            case 'ban':
                if (!isGroupMsg) return client.reply(from, 'Esse comando foi feito para funcionar apenas em Grupos!', id)
                if (!isOwner) return client.reply(from, 'Esse comando só pode ser usado pelo dono do  Bot.', id)
                if (!isBotGroupAdmins) return client.reply(from, 'Você precisa tornar o BOT um Admin do Grupo', id)
                if (mentionedJidList.length === 0) return client.reply(from, 'Utilize *ban @id*', id)
                if (mentionedJidList[0] === botNumber) return await client.reply(from, 'Você não pode usar esse comando no BOT!', id)
                await client.sendTextWithMentions(from, `O membro ${mentionedJidList.map(x => `@${x.replace('@c.us', '')} foi removido por mau uso do BOT. Bloqueado o uso`).join('')}`)
                for (let i = 0; i < mentionedJidList.length; i++) {
                    if (groupAdmins.includes(mentionedJidList[i])) return await client.sendText(from, 'Você não pode remover um Admin.')
                    await client.removeParticipant(groupId, mentionedJidList[i])
                    await client.contactBlock(mentionedJidList[i])
                }
                break
                //
            case 'exit':
                if (!isGroupMsg) return client.reply(from, 'Desculpe, este comando só pode ser usado dentro de grupos!', id)
                if (!isOwner) return client.reply(from, 'Desculpe, este comando só pode ser usado pelo dono do Bot!', id)
                client.sendText(from, 'Adeus pessoal...').then(() => client.leaveGroup(groupId))
                break
            case 'leaveall':
                if (!isOwner) return client.reply(from, 'Disponível somente para o criador do BOT!', id)
                const allChatz = await client.getAllChatIds()
                const allGroupz = await client.getAllGroups()
                for (let gclist of allGroupz) {
                    await client.sendText(gclist.contact.id, `Precisei Sair desse Grupo. Ainda funciono no Privado : ${allChatz.length}`)
                    await client.leaveGroup(gclist.contact.id)
                    await client.deleteChat(gclist.contact.id)
                }
                client.reply(from, 'Pronto, saí de todos os grupos!!', id)
                break
            case 'clearall':
                if (!isOwner) return client.reply(from, 'Comando exclusivo do dono do Bot!', id)
                const allChatx = await client.getAllChats()
                for (let dchat of allChatx) {
                    await client.deleteChat(dchat.id)
                }
                client.reply(from, 'Todos os chats foram limpos!', id)
                break
            case 'join':
                if (args.length == 0) return client.reply(from, `Utilize o comando: \n *${prefix}join [link]*`, id)
                let linkgrup = body.slice(6)
                let islink = linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi)
                let chekgrup = await client.inviteInfo(linkgrup)
                if (!islink) return client.reply(from, 'Este convite não parece ser do WhatApp', id)
                if (isOwner) {
                    await client.joinGroupViaLink(linkgrup)
                        .then(async () => {
                            await client.sendText(from, '[👩🏽] Entrei no grupo com sucesso via link!')
                            await client.sendText(chekgrup.id, `[👩🏽] Olá, meu nome é ISIS. Sou uma 'BOT' conheça meus comandos usando: *${prefix}menu*`)
                        })
                } else {
                    let cgrup = await client.getAllGroups()
                    if (cgrup.length > groupLimit) return client.reply(from, `Desculpe, mas no momento não estou entrando em grupos pois atingi o limite de grupos que posso estar.\nLimite: ${groupLimit}`, id)
                    if (cgrup.size < 150) return client.reply(from, `Limite de Membros no grupo é de ${memberLimit} pessoas`, id)
                    await client.joinGroupViaLink(linkgrup)
                        .then(async () => {
                            await client.reply(from, 'Entrou no grupo com sucesso via link!', id)
                        })
                        .catch(() => {
                            client.reply(from, 'Acorreu um erro ao Adicionar o Bot no Grupo!', id)
                        })
                }
                break
            case 'stats':
            case 'status':
                const rTime = (seconds) => {
                    const pad = (s) => { return (s < 10 ? '0' : '') + s }
                    var hours = Math.floor(seconds / (60*60)); var minutes = Math.floor(seconds % (60*60) / 60); var seconds = Math.floor(seconds % 60)
                    return `${pad(hours)} horas | ${pad(minutes)} minutos | ${pad(seconds)} segundos`
                }
                const osUptime = () => {
                    var up_sec = os.uptime(); var up_min = up_sec / 60; var up_hour = up_min / 60; up_sec = Math.floor(up_sec); up_min = Math.floor(up_min); up_hour = Math.floor(up_hour); up_hour = up_hour % 60; up_min = up_min % 60; up_sec = up_sec % 60
                    return `${up_hour} horas | ${up_min} minutos | ${up_sec} segundos`
                }
                const ramMemory = () => {
                    var allRam = os.totalmem()/1024/1024;
                    var freeRam = os.freemem()/1024/1024;
                    var usoRam = allRam - freeRam;
                    return `Total: ${Math.floor(allRam)}MB | Em uso: ${Math.floor(usoRam)}MB | Livre: ${Math.floor(freeRam)}MB`
                }

                const waVersion = await client.getWAVersion()
                const bateria = await client.getBatteryLevel()
                const conectado = await client.getIsPlugged()
                const timeBot = rTime(process.uptime())
                const licenca = await client.getLicenseType()
                const sessionID = await client.getSessionId()
                const loadedMsg = await client.getAmountOfLoadedMessages()
                const chatIds = await client.getAllChatIds()
                const groups = await client.getAllGroups()
                await client.sendText(from, `\n*[STATUS ISIS-BOT]* \n\n *Informações do WhatsApp*\n📊 - *${loadedMsg}* Mensagens carregadas no Cache \n📱 - *${groups.length}* Conversas em grupo\n👥 - *${chatIds.length - groups.length}* Conversas no PV\n📈 - *${chatIds.length}* Total de chats\n\n *Tempo de funcionamento:*\n⌛ Uptime Bot - ${timeBot}\n💻​ Uptime Server - ${osUptime()}\n\n *Dados Hospedagem:*\n🌡️ CPU - ${os.cpus()[0].model} (${os.cpus()[0].speed} MHz)\n🖥️ S.O - ${os.type()} - ${os.arch()} (${os.platform} V. ${os.release()})\n💾 RAM - ${ramMemory()}\n👑 Hostname - ${os.hostname()}\n\n *Dados Cliente:*\n🥏 Versão WhatsApp - *${waVersion}*\n🔋 Bateria - ${bateria}%\n🔌 Carregando - ${conectado ? '*NÃO*':'*SIM*'}\n📝 Licença em Uso - ${licenca ?'*EM REGISTRO*':'*SIM*'}\n🤖 ID Sessão - ${sessionID}\n\n`)
                break
            default:
                console.log(color('[ERROR]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Comando não registrado de ', color(pushname))
                await client.sendText(from, '[🤷🏽‍♀️] Ops, Não localizei esse comando!')
                break
        }
    } catch (err) {
        console.error(color(err, 'red'))
    }
}