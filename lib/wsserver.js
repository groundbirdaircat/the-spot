const WebSocket = require('ws')
var wss

const Client = require('./wsclient.js')


function handleConnect(ws, req){
    Client.new({ws})
}
function handleListening(){ 
    console.log(
        '          ' + 
        'WebSocket Listening:', 
        3000
    )
}

function update(){
    Client.all.forEach(client => {
        client.sendUpdateToWS()
    })
    setTimeout(update, 1000 / 60)
}

module.exports = {
    start( server ) {
        wss = 
            new WebSocket
                .Server( { server } )

        wss.on('connection', handleConnect)
        wss.on('listening', handleListening)
        update()
    }
}