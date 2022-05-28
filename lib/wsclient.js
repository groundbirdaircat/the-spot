module.exports = {
    get all() { return allClients },
    new(obj){ 
        return (
            Object
            .create(Client)
            .init(obj) 
        )
    },
}

var allClients = [],
    allIDs = []

const map = require('./map.js')

const Client = {
    init(obj){
        // this.wss = obj.wss

        this.id = this.generateUniqueID()
        this.ws = obj.ws
        this.pingTimeout = null

        this.messageHandler = this.handleMessage.bind(this)
        this.pongHandler = this.handlePong.bind(this)

        allClients.push(this)
        
        this.sendObjToWS({
            type: 'init',
            id: this.id,
        })

        this.dispatchConnectionLog('connect')

        this.initPingPong()
        this.setMessageListener()

        return this
    },
    
    // UNIQUE ID
    alphabet: 'abcdehijklmopqruvwxyz' +
              'ABCDEHIJKLMOPQRUVWXYZ',
    getRandomLetter(){
        return this.alphabet[
            Math.floor(
                Math.random() * 
                this.alphabet.length
            )
        ]
    },
    generateUniqueID(){
        var newID = ''

        for (let i = 6; i > 0; i--) {
            if (Math.random() > .5)
                newID += this.getRandomLetter()

            else newID += Math.floor(
                Math.random() * 10
            )
        }

        if (allIDs.includes(newID)) 
            return this.generateUniqueID()

        allIDs.push(newID)

        return newID
    },
    removeIDFromAllIDs(id){
        var index = allIDs.indexOf(id)

        if (index < 0)
            return console.log(
                'tried to remove ID but no ID was found'
            )

        allIDs.splice(index, 1)
    },

    // CONNECTION
    logConnection: false,
    removeFromAllClients(){
        var index = allClients.indexOf(this)

        if (index < 0) return console.log(
            'ERROR REMOVE FROM ALL CLIENTS FOUND NO INDEX'
        )

        this.ws.off('message', this.messageHandler)
        this.ws.off('pong', this.pongHandler)

        this.removeIDFromAllIDs(this.id)
        allClients.splice(index, 1)

        this.dispatchConnectionLog('remove')
    },
    checkUserReturnedInit(data){
        if (this.id == data.id) {
            this.sendObjToWS({
                map: map.map,
                type: 'map',
            })
        }
        else if (allIDs.includes(data.id)) {
            this.reuseClientFromID(data.id)
            this.sendObjToWS({
                map: map.map,
                type: 'map',
            })
        }
        else {
            this.sendObjToWS({
                type: 'init',
                id: this.id,
                force: true,
            })
            this.sendObjToWS({
                map: map.map,
                type: 'map',
            })
        }
    },
    reuseClientFromID(id){
        // find other client obj
        var originalClient = allClients.find(cl => cl.id == id)
        if (!originalClient) return console.log('this shouldnt happen')

        // log about it
        if (this.logConnection) console.log(
            '*reusing old client. id:',
            this.id,
            'swapping back to id:',
            originalClient.id
        )

        // cancel their timeouts
        originalClient.clearPingTimeout()
        this.clearPingTimeout()

        // replace the old websocket
        originalClient.ws.close()
        originalClient.ws = this.ws
        originalClient.setMessageListener()

        // restart the ping
        originalClient.initPingPong()

        // remove newly created client obj
        this.removeFromAllClients()
    },
    dispatchConnectionLog(type){
        if (!this.logConnection) return

        var msg = '' 

        switch (type) {
            case 'connect':
                msg += 'client connected. id:'
                break
            case 'remove':
                msg += 'client removed. id:'
                break
        }

        if (msg) {
            return console.log(
                msg, 
                this.id, 
                '/ total connected clients:', 
                allClients.length
            )
        }
    },

    // PING PONG
    pingTimeoutLength: 10000,
    pingPongTimeBetweenPings: 10000,
    logPP: false,
    initPingPong(){
        this.ws.on('pong', this.pongHandler)
        this.sendPing()
    },
    sendPing(){
        this.ws.ping()

        this.clearPingTimeout()

        this.pingTimeout = 
            setTimeout(
                this.handlePongTimedOut.bind(this),
                this.pingTimeoutLength
            )

        this.dispatchPPLog('ping')
    },
    handlePong(){
        this.clearPingTimeout()

        this.pingTimeout = 
            setTimeout(
                this.sendPing.bind(this),
                this.pingPongTimeBetweenPings
            )

        this.dispatchPPLog('pong')
    },
    handlePongTimedOut(){
        this.ws.close()
        
        this.dispatchPPLog('timeout')

        this.removeFromAllClients()
    },
    clearPingTimeout(){
        clearTimeout(this.pingTimeout)
    },
    dispatchPPLog(type){
        if (!this.logPP) return

        var beforeMsg = '     ',
            msg = ''

        switch (type) {
            case 'ping':
                msg += 'ping: '
                break
            case 'pong':
                msg += 'pong: '
                break
            case 'timeout':
                msg += 'pong timed out: '
                break
        }

        if (msg) return console.log(beforeMsg, msg, this.id)
    },

    // MESSAGE
    logMessages: false,
    setMessageListener(){
        this.ws.on('message', this.messageHandler)
    },
    verifyJSON(msg) {
        try {
            JSON.parse(msg);
            return true;
        }
        catch (error) {
            return false;
        }
    },
    handleMessage(data){
        if (!this.verifyJSON(data)) 
            return console.log(
                'received non json message'
            )

        data = JSON.parse(data)

        switch (data.type) {
            case 'message':
                if (this.logMessages) console.log(
                    'message from id', 
                    this.id, 
                    ':', 
                    data.message
                )
                this.sendMessageToAll(data)
                break

            case 'init':
                this.checkUserReturnedInit(data)
                break
        }
    },
    sendMessageToAll(data){
        for (var i = allClients.length - 1; i >= 0; i--) {
            allClients[i].sendObjToWS(data)
        }
    },
    sendObjToWS(obj){
        this.ws.send(
            JSON.stringify(
                obj
            )
        )
    }
}