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
    allPlayerClients = {}

const { uID } = require('./utils.js')

const map = require('./map.js')

const Client = {
    init(obj){
        this.id = uID.generate('client')
        this.ws = obj.ws
        this.pingTimeout = null

        this.player = null
        this.lastUpdateData = ''

        // need reference to the fn
        // to remove listeners 
        // when clients get reused
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

        this.removePlayer()

        uID.remove('client', this.id)
        allClients.splice(index, 1)

        this.dispatchConnectionLog('remove')
    },
    createPlayer(){
        // remove player if it exists
        this.removePlayer()

        var spawnPoint = map.getRandomSpawnPoint()

        this.player = map.createPlayer({
            x: spawnPoint[0],
            y: spawnPoint[1]
        })
        allPlayerClients[this.player.playerID] = this

        return spawnPoint
    },
    removePlayer(){
        if (!this.player) return

        // remove player id ref from all player clients
        delete allPlayerClients[this.player.playerID]

        // remove player from tiles
        // and remove playerID
        this.player.removePlayer()

        // drop ref
        this.player = null
    },
    sendMapIfNeeded(data){
        if (data.mID == map.id) return

        var spawnPoint = this.createPlayer()

        this.sendObjToWS({
            map: map.getMap,
            playerID: this.player.playerID,
            type: 'map',
            spawnPoint
        })
    },
    checkUserReturnedInit(data){
        // reuse old client object
        // if user returned a different id
        // and that clientid still exists
        if (
            this.id != data.id &&
            uID.checkIfIDExists('client', data.id)
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
    verifyAndParseJSON(msg) {
        try { return JSON.parse(msg) }
        catch { return console.log('received non json message') }
    },
    handleMessage(data){
        data = this.verifyAndParseJSON(data)

        if (!data) return 

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
                this.player.move(data)
                break
        }
    },
    validateChatMessage( { message } ){
        return (
            message &&
            message.length < 201 &&
            typeof message == 'string'
        )
    },
    sendMessageToAll(data){
        data.message = 
            data.message
                .trim()
                .replace(/\s{1,}/g, ' ')

        if (!this.validateChatMessage(data)) return

        var tiles = [],
            players = [],
            sendData = {
                type: 'message',
                message: data.message,
                id: this.player.playerID
            }

        tiles = map.getTilesAroundPlayer(this.player)

        // get all playerIDs 
        // from tiles around player
        players = 
            this.getPlayersFromTiles(tiles)
                .map(plyr => plyr.playerID)

        // send message to those players
        // including self
        players.forEach(plyrID => {
            allPlayerClients[plyrID].sendObjToWS(sendData)
        })
    },
    sendObjToWS(obj){
        this.ws.send(
            JSON.stringify(
                obj
            )
        )
    },
    sendUpdateToWS(){
        if (!this.player) return

        var tiles = [],
            updateData = { type: 'update' }

        tiles = map.getTilesAroundPlayer(this.player)

        // create player objects to send to ws
        // from players around tiles
        // not including self
        // { id, x, y, under }
        updateData.players = 
            this.getPlayersFromTiles(tiles)
                .filter(plyr => 
                    plyr.playerID != this.player.playerID)
                        .map(plyr => ({
                            id: plyr.playerID,
                            x: plyr.x,
                            y: plyr.y,
                            under: plyr.under
                        }) )

        // don't send update if the
        // data is the same 
        // as previously sent
        var data = JSON.stringify(updateData)
        if (data == this.lastUpdateData) return

        this.lastUpdateData = data

        this.ws.send(data)
    },
    getPlayersFromTiles(tiles){
        return (
            tiles.reduce((a, c) => 
                a.concat(c.players),[])
        )
    }
}