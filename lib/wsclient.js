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

        this.lastUpdate = {
            data: '',
            playerPackage: '',
            itemPackage: '',
        }

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

        if (index < 0) return console.info(
            'ERROR REMOVE FROM ALL CLIENTS FOUND NO INDEX'
        )

        this.ws.off('message', this.messageHandler)
        this.ws.off('pong', this.pongHandler)

        this.removePlayer()

        uID.remove('client', this.id)
        allClients.splice(index, 1)

        this.dispatchConnectionLog('remove')
    },
    createPlayer( { color, name } ){
        // remove player if it exists
        this.removePlayer()

        var spawnPoint = map.getRandomSpawnPoint()

        this.player = map.createPlayer({
            x: spawnPoint[0],
            y: spawnPoint[1],
            color,
            name
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

        var spawnPoint = this.createPlayer(data)

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
        if (!originalClient) return console.info('this shouldnt happen')

        // log about it
        if (this.logConnection) console.info(
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
            return console.info(
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

        if (msg) return console.info(beforeMsg, msg, this.id)
    },

    // MESSAGE
    logMessages: false,
    setMessageListener(){
        this.ws.on('message', this.messageHandler)
    },
    verifyAndParseJSON(msg) {
        try { return JSON.parse(msg) }
        catch { return console.info('received non json message') }
    },
    handleMessage(data){
        data = this.verifyAndParseJSON(data)

        if (!data) return 

        switch (data.type) {
            case 'message':
                if (this.logMessages) console.info(
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

            case 'item':
                this.handleItemRequest(data)
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
                id: this.player.playerID,
                name: this.player.name,
                icons: [ { color: this.player.color } ]
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

    // UPDATE
    sendUpdateToWS(){
        if (!this.player) return

        var tiles = [],
            updateData = { type: 'update' }

        // get tiles around player

        tiles = map.getTilesAroundPlayer(this.player)

        // set player update package

        updateData.players = 
            this.getPlayerUpdate(tiles)
            
        if (updateData.players)
            updateData.playerUpdate = 1

        // set item update package

        updateData.items = 
            this.getItemUpdate(tiles)

        if (updateData.items)
            updateData.itemUpdate = 1

        // compare full package

        var data = JSON.stringify(updateData)
        if (data == this.lastUpdate.data) return

        this.lastUpdate.data = data

        this.ws.send(data)
    },
    getPlayersFromTiles(tiles){
        return (
            tiles.reduce((a, c) => 
                a.concat(c.players),[])
        )
    },
    getPlayerUpdate(tiles){
        // create player objects to send to ws
        // from players around tiles
        // not including self
        var package = this.getPlayersFromTiles(tiles)
                .filter(plyr => 
                    plyr.playerID != this.player.playerID)
                        .map(plyr => ({
                            id: plyr.playerID,
                            x: plyr.x,
                            y: plyr.y,
                            under: plyr.under,
                            color: plyr.color
                        }) )

        // compare player package
        // to last sent player package update
        var playerStringPackage = 
            JSON.stringify(package)

        if (
            playerStringPackage !=
            this.lastUpdate.players
        ) {
            // save player package
            this.lastUpdate.players = 
                playerStringPackage

            return package
        }
        else return undefined
    },
    getItemUpdate(tiles){
        // get all items from tiles
        var package = 
            tiles.reduce((a, c) => 
                a.concat(c.items)
            , [])
            
        var housePackage = []

        var currentTile = 
            map.getTile(
                this.player.tileX,
                this.player.tileY,
            )

        // only get house tiles
        // from local tile's house
        if (currentTile.holding.length) {
            housePackage = 
                currentTile.holding[0]?.items
        }
        // or linked house
        else if (currentTile.linkedFrom) {
            housePackage = 
                map.getTile(
                    currentTile.linkedFrom[0],
                    currentTile.linkedFrom[1]
                ).holding[0]?.items
        }

        if (housePackage?.length) {
            housePackage = 
                housePackage.map(item => ({
                    ...item,
                    house: 1,
                }))
                
            package = package.concat(housePackage)
        }
        

        // only need this data sent
        package = 
            package.filter(x => x)
            .map(( { id, itemType, tag, x, y, house } ) => ({
                type: itemType,
                id,
                tag,
                x,
                y,
                house
            }))

        var itemStringPackage = 
            JSON.stringify(package)

        // compare item package
        if (
            itemStringPackage !=
            this.lastUpdate.items
        ) {
            // save item package
            this.lastUpdate.items = 
                itemStringPackage

            return package
        }
        else return undefined
    },

    // ITEMS
    handleItemRequest(data){
        switch (data.action) {
            case 'pickup':
                this.handleItemPickup(data)
                break
            
            case 'drop':
                this.handleItemDrop(data)
                break
        }
    },
    handleItemPickup( { id } ){
        var item = map.getAllItems.find(item => item.id == id)

        if (!item.itemInWorld) return

        item.pickItemUp(this.player)

        this.sendObjToWS({
            type: 'item',
            itemType: item.itemType,
            id: item.id
        })
    },
    handleItemDrop(data){
        var item = 
            map.getAllItems
            .find(item => 
                item.id == data.id
            )

        item.removeFromPlayerItems(this.player)

        item.addToTile(data)
    },
}