const WebSocket = require('ws')
const wss = 
    new WebSocket
        .WebSocketServer({ 
            port: 5000,
        })

const Client = require('./wsclient.js')

wss.on('connection', handleConnect)
wss.on('listening', handleListening)

function handleConnect(ws, req){
    Client.new({ws})
}
function handleListening(){ 
    console.log(
        '          ' + 
        'WebSocket Listening:', 
        wss.options.port
    )
}

function update(){
    // console.log('update')
    Client.all.forEach(client => {
        // client.sendObjToWS({
        //     type: 'test',
        //     message: 'yo'
        // })
        client.sendTilesToWS()
        // console.log(client.player.playerID)
    })
    setTimeout(update, 1000 / 60)
}
update()