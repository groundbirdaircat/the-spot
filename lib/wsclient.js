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

var allClients = []

const { uID } = require('./utils.js')

const map = require('./map.js')

const Client = {
    init(obj){
        this.id = uID.generate()
        this.ws = obj.ws
        this.pingTimeout = null

        this.player = null

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

    // CONNECTION
    logConnection: true,
    removeFromAllClients(){
        var index = allClients.indexOf(this)

        if (index < 0) return console.log(
            'ERROR REMOVE FROM ALL CLIENTS FOUND NO INDEX'
        )

        this.ws.off('message', this.messageHandler)
        this.ws.off('pong', this.pongHandler)

        if (this.player) this.player.removePlayer()

        uID.remove(this.id)
        allClients.splice(index, 1)

        this.dispatchConnectionLog('remove')
    },
    sendMapIfNeeded(data){
        if (data.mID == map.id) return

        var spawnPoint = map.getRandomSpawnPoint()

        this.player = map.createPlayer({
            x: spawnPoint[0],
            y: spawnPoint[1]
        })

        this.sendObjToWS({
            map: map.getMap,
            playerID: this.player.playerID,
            type: 'map',
            spawnPoint
        })
    },
    checkUserReturnedInit(data){
        if (
            // check if user returned a different id
            // and that id still exists
            this.id != data.id &&
            uID.checkIfIDExists(data.id)
        ) {
            this.reuseClientFromID(data.id)
        }
        else {
            this.sendObjToWS({
                type: 'init',
                id: this.id,
                force: true,
            })
        }
        this.sendMapIfNeeded(data)
    },
    reuseClientFromID(id){
        // find other client obj
        var originalClient = allClients.find(cl => cl.id == id)
        if (!originalClient) return console.log('this shouldnt happen')

        // log about it
        if (this.logConnection) console.log(
            '* reusing old client. id:',
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

            case 'move':
                this.player.move(data.x, data.y)
                break
        }
    },
    sendMessageToAll(data){

        var players = []

        // check 5 tiles before, 5 tiles after
        // in both directions
        // for players
        for (let x = this.player.tileX - 5, xEnd = this.player.tileX + 5; x <= xEnd; x++){
            for (let y = this.player.tileY - 5, yEnd = this.player.tileY + 5; y <= yEnd; y++){
                let tilePlayers = map.getTile(
                    x, 
                    y,
                )?.players

                if (tilePlayers?.length) players.push(...tilePlayers)
            }
        }

        data.id = this.player.playerID

        players = 
            players.map(plyr => {
                return plyr.playerID
            })

        players.forEach(plyrID => {
            var found = allClients.find(cl => cl.player.playerID == plyrID)
            if (found) found.sendObjToWS(data)
        })
    },
    sendObjToWS(obj){
        this.ws.send(
            JSON.stringify(
                obj
            )
        )
    },
    sendTilesToWS(){
        if (!this.player) return

        var players = []

        // check 5 tiles before, 5 tiles after
        // in both directions
        // for players
        for (let x = this.player.tileX - 5, xEnd = this.player.tileX + 5; x <= xEnd; x++){
            for (let y = this.player.tileY - 5, yEnd = this.player.tileY + 5; y <= yEnd; y++){
                let tilePlayers = map.getTile(
                    x, 
                    y,
                )?.players

                if (tilePlayers?.length) players.push(...tilePlayers)
            }
        }


        players = 
            players.filter(plyr => plyr.playerID != this.player.playerID)
            .map(plyr => {
                return {
                    id: plyr.playerID,
                    x: plyr.x,
                    y: plyr.y
                }
            })

        // if (!players.length) return

        this.sendObjToWS({
            type: 'update',
            players
        })
        
        // console.log(players)
    },
}