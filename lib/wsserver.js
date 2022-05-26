const WebSocket = require('ws')
const wss = new WebSocket.WebSocketServer({ port: 5000})
var socketInitialized = false

const Client = require('./wsclient.js')

wss.on('connection', handleConnect)

function handleConnect(ws, req){
    if (!socketInitialized) return initializeSocket()
    else Client.new({ws})
}
function initializeSocket(){ 
    socketInitialized = true
    console.log(
        '          ' + 
        'WebSocket Initialized:', 
        wss.options.port
    )
    console.log()
}

new WebSocket("ws://localhost:5000")