exports.textCopy = () => {
    return `
	Este Bot foi é um Fork feito por Igor Sardinha, o original foi criado por YogaSakti. Código disponível no GitHUB! `
}

exports.textMenu = (pushname) => {
    return `
✨Olá, ${pushname || ''}!

*Comandos da ISIS:* 

_Criar Figurinhas:_

1. *#sticker*
Envie uma imagem com a legenda *#sticker* ou responda a imagem com o texto *#sticker*.
2. *#stickergif*
Envie um GIF ou VÍDEO com a legenda *#stickergif* ou responda com o texto *#stickergif*.
3. *#stickernobg*
Envie uma imagem com a legenda *#stickernobg* ou responda a imagem com o texto *#stickernobg*.
4. *#stickertoimg*
Transforme um Sticker em uma Imagem, funciona com Animadas e Estáticas


_Downloads[BETA]:_

1. *#fb* _link-do-post_
Baixe um video do Facebook.
2. *#ig* _link-do-post_
Baixe um vídeo do Instagram.
3. *#twt* _link-do-post_
Baixe um vídeo do Twitter.


_Outros Comandos:_

1. *#ping*
Mostra o Tempo de Resposta do BOT.
2. *#criador*
Use quando precisar de ajuda com o uso do BOT.
3. *#meme texto-superior | texto-inferior*
Crie um meme a partir de uma foto.
4. *#imagens _pesquisa_* 
Envia uma imagem com base na sua Pesquisa.
5. *#nobg*
Remova o Fundo de uma Foto ou Imagem.
6. *#menuadmin*
Menu para os Administradores de um Grupo.
7. *#covid _pais_* _Obs: Nome do Pais em Inglês!!_
Retorna um boletim sobre o Corona-Virus no pais informado.
8. *#cotacao*
Retorna a Cotação do DÓLAR, EURO e BITCOIN em Tempo Real.
9. *#cep _cep_*
Retorna o endereço completo do CEP Informado. _Obs: Não funciona em cidades que tem apenas 1 CEP!_
10. *#letra _nome da musica_*
Retorna a Letra da Musica informada.
11. *#encurtar _link_* 
Retorna o Link encurtado.
12. *#tts _idioma_ _texto_*
Retorna o Audio do Texto Informado
13. *#status*
Mostra Informações Importantes do BOT.
14. *#horoscopo _data-de-nascimento_*
Seu Horóscopo diário..
15. *#rastrear _codigo-rastreio_*
Rastreio de Encomendas...
16. *#wiki _pesquisa_* Obs: Coloque _ nos espaços!
Baixe uma pagina completa da Wikipédia.
17. *#ocr*
Converta uma imagem em texto.
18. *#txtimg _text_*
Escreva em uma folha de papel virtual.
19. *#calc operacao/expressão* Ex: #calc 1.2 * (2 + 4.5)
Um calculadora completa com suporte a muitos tipos de operações.
20. *#vxd*, *#verdade*, *#desafio
Jogo verdade ou desafio
21. *#eununca*
Jogo "Eu Nunca..."
22. *#kiss*
Beijar alguém....
23. *qrread _link-qr_*
Leia um QrCode a partir de um Link
24. *qrcode texto/link*
Crie um QrCode
25 - *#texto3d texto*
Comando em fase de testes
26 - *#neon texto | texto*
Comando em fase de testes

Comandos Alternativos: *#comandos*

Obrigado por usar o Bot!✨

`
}

exports.textAdmin = () => {
    return `
*Comandos de Grupos* 

1. *#kick* @user
Remover membros do Grupo.
2. *#promote* @user
Promover membros a Admin.
3. *#demote* @user
Demotar membros.
4. *#add numero _'insira 55DDDNUMERO'_*
Adicionar alguém no Grupo
5. *#adm*
Menciona todos os Adms do Grupo
6. *#tagall*
Menciona todos os membros do Grupo
7. *#link*
Retorna o Link do Grupo`
}

exports.aliases = () => {
    return `
*Lista de Comandos Alternativos* 

*Para Stickers Básicos:*
#sticker, #stiker, #figurinha, #fig, #stk, #adesivo.

*Para Stickers Animados:*
#stickergif, #stikergif, #sgif, #gifstiker, #gifsticker, #figanimada, #figurinhaanimada.

*Para converter Stickers em Imagens:*
#stikertoimg, #stickertoimg, #stimg, #stk-img.

*Para Stickers PNG / Sem Fundo:*
#stickernobg, #stikernobg, #figurinhapng, #stickerpng, #spng.

*Para Downloads:*
_Instagram:_ #insta, #ig, #instagram
_Twitter:_ #twt, #twitter
_Facebook:_ #fb, #face, #facebook

*Para imagens sem Fundo:*
#png, #nobg, #recorte, #removebg

Regularmente está lista é alterada.
`
}