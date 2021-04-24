const { create, Client } = require('@open-wa/wa-automate')
const { color, messageLog } = require('./utils')
const msgHandler = require('./handler/message')

const start = (client = new Client()) => {
    console.log('[DEV]', color('Igor Sardinha', 'yellow'))
    console.log('[STATUS] Conectado e Funcional!')

    // Message log for analytic
    client.onAnyMessage((fn) => messageLog(fn.fromMe, fn.type))

    // Force it to keep the current session
    client.onStateChanged((state) => {
        console.log('[Status do Bot]', state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') client.forceRefocus()
    })

    // listening on message
    client.onMessage((message) => {
        // Cut message Cache if cache more than 3K
        client.getAmountOfLoadedMessages().then((msg) => (msg >= 3000) && client.cutMsgCache())
        // Message Handler
        msgHandler(client, message)
    })


    client.onAddedToGroup(({ groupMetadata: { id }, contact: { name } }) =>
        client.getGroupMembersId(id)
            .then((ids) => {
                console.log('[GRUPO]', color(`O Bot foi Adicionado a um Grupo. [ ${name} => ${ids.length}]`, 'yellow'))
                if (ids.length <= 1000) {
                    client.sendText(id, 'Olá, estou desativado em grupos. Use no PV!').then(() => client.leaveGroup(id))
                } else {
                    client.sendText(id, `Olá membros do grupo *${name}*, sou um bot de ajuda. Envie *#ajuda* e veja o que eu posso fazer.`)
                }
            }))

            client.onGlobalParicipantsChanged(async (event) => {
                const host = await client.getHostNumber() + '@c.us'
                const welcome = JSON.parse(fs.readFileSync('./settings/welcome.json'))
                const isWelcome = welcome.includes(event.chat)
                let profile = await client.getProfilePicFromServer(event.who)
                if (profile == '' || profile == undefined) profile = 'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTQcODjk7AcA4wb_9OLzoeAdpGwmkJqOYxEBA&usqp=CAU'
                if (event.action === 'add' && event.who !== host && isWelcome) {
                    await client.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
                    await client.sendTextWithMentions(event.chat, `👩🏽 Olá, Seja Bem-Vindo ao Grupo! @${event.who.replace('@c.us', '')} \n\n*Siga as Regras na Descrição do Grupo!*✨`)
                }
                if (event.action === 'remove' && event.who !== host) {
                    await client.sendFileFromUrl(event.chat, profile, 'profile.jpg', '')
                    await client.sendTextWithMentions(event.chat, `🤷🏽‍♀️ Adeus... @${event.who.replace('@c.us', '')} ✨`)
                }
            })

    client.onIncomingCall(( async (call) => {
        await client.sendText(call.peerJid, '🙎🏽‍♀️ Hey! Pare de me ligar. Eu sou não posso te atender!')
    }))
}

const options = {
    sessionId: 'Sardinha',
    headless: true,
    qrTimeout: 0,
    authTimeout: 0,
    restartOnCrash: start,
    cacheEnabled: false,
    useChrome: true,
    killProcessOnBrowserClose: true,
    throwErrorOnTosBlock: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}

create(options)
    .then((client) => start(client))
    .catch((err) => new Error(err))
