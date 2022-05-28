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