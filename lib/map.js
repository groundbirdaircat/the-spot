const { rand, randFloor, uID } = require('./utils.js')

var item = {
    type: 'item',
    init(infos){
        this.itemType = infos.itemType

        this.x = infos.x
        this.y = infos.y
        this.tileX = infos.tileX
        this.tileY = infos.tileY

        this.tag = infos.tag

        this.dX = this.dY = 0

        return this
    },
    new(infos){
        return Object.create(this).init(infos)
    },
    removeFromTile(){
        var tile = map.tiles[this.tileX][this.tileY]

        // handle item existing in tile items
        let index = tile.items.indexOf(this)
        if (index >= 0) {
            tile.items.splice(
                index
                , 1
            )
        }
        // handle tile existing in tile's holding items
        else if (tile.holding[0]) {
            index = tile.holding[0].items.indexOf(this)
            if (index >= 0) {
                tile.holding[0].items.splice(
                    index
                    , 1
                )
            }
            else console.log('tried to remove item from tile but found no index for it')
        }
        // handle tile existing in linked tile's holding items
        else if (tile.linkedFrom) {
            tile = map.tiles[tile.linkedFrom[0]][tile.linkedFrom[1]]
            index = tile.holding[0].items.indexOf(this)
            if (index >= 0) {
                tile.holding[0].items.splice(
                    index
                    , 1
                )
            }
            else console.log('LINKED tried to remove item from tile but found no index for it')
        }
    },
    putInPlayerItems(){
        // this.x = 
        // this.y = 
        // this.tileX = 
        // this.tileY = -1

        // thePlayer.items.holding.push(this)
        // thePlayer.inventory.updateList()

        // this.inCollisionRange = false
    },
    pickItemUp(){ // TODO: still need to implement
        this.removeFromTile()
        // this.putInPlayerItems()
    },
}

var tree = {
    type: 'tree',
    init(infos){
        this.x = infos.x * map.tileSize
        this.y = infos.y * map.tileSize

        return this
    },
    new(infos){
        return Object.create(this).init(infos)
    },

}

var road = {
    type: 'road',
    init(info){
        this.x = info.x
        this.y = info.y
        this.connectingRoad = info.connectingRoad
        this.corner = info.corner

        if (info.forceConnectingRoad) this.connectingRoad = true

        return this
    },
    new(info){
        return Object.create(this).init(info)
    },
}

var makeHouse = {
    // HOUSE 3
    house3D1( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(2 + x, 14 + y, 'a2'),
                spawnPoint.new(11 + x, 2 + y, 'a3'),
                spawnPoint.new(14 + x, 2 + y, 'c1'),
                spawnPoint.new(19 + x, 2 + y, 'c2'),
                spawnPoint.new(14 + x, 10 + y, 'c3'),
                spawnPoint.new(19 + x, 10 + y, 'c4'),
                spawnPoint.new(22 + x, 2 + y, 'd1'),
                spawnPoint.new(33 + x, 2 + y, 'd2'),
                spawnPoint.new(22 + x, 10 + y, 'd3'),
                spawnPoint.new(33 + x, 10 + y, 'd4'),
                spawnPoint.new(36.5 + x, 2 + y, 'e1'),
                spawnPoint.new(40 + x, 2 + y, 'f1'),
                spawnPoint.new(53 + x, 2 + y, 'f2'),
                spawnPoint.new(53 + x, 14 + y, 'f3'),
            ]
        }
    },
    house3U1( { x, y } ){
        var x = x + 2.5, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(2 + x, 14 + y, 'a2'),
                spawnPoint.new(11 + x, 14 + y, 'a3'),
                spawnPoint.new(14 + x, 6 + y, 'c1'),
                spawnPoint.new(19 + x, 6 + y, 'c2'),
                spawnPoint.new(14 + x, 14 + y, 'c3'),
                spawnPoint.new(19 + x, 14 + y, 'c4'),
                spawnPoint.new(22 + x, 6 + y, 'd1'),
                spawnPoint.new(33 + x, 6 + y, 'd2'),
                spawnPoint.new(22 + x, 14 + y, 'd3'),
                spawnPoint.new(33 + x, 14 + y, 'd4'),
                spawnPoint.new(36.5 + x, 6 + y, 'e1'),
                spawnPoint.new(40 + x, 14 + y, 'f1'),
                spawnPoint.new(53 + x, 2 + y, 'f2'),
                spawnPoint.new(53 + x, 14 + y, 'f3'),
            ]
        }
    },
    house3R1( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(14 + x, 2 + y, 'a2'),
                spawnPoint.new(14 + x, 11 + y, 'a3'),
                spawnPoint.new(6 + x, 14 + y, 'c1'),
                spawnPoint.new(6 + x, 19 + y, 'c2'),
                spawnPoint.new(14 + x, 14 + y, 'c3'),
                spawnPoint.new(14 + x, 19 + y, 'c4'),
                spawnPoint.new(6 + x, 22 + y, 'd1'),
                spawnPoint.new(6 + x, 33 + y, 'd2'),
                spawnPoint.new(14 + x, 22 + y, 'd3'),
                spawnPoint.new(14 + x, 33 + y, 'd4'),
                spawnPoint.new(6 + x, 36.5 + y, 'e1'),
                spawnPoint.new(14 + x, 40 + y, 'f1'),
                spawnPoint.new(2 + x, 53 + y, 'f2'),
                spawnPoint.new(14 + x, 53 + y, 'f3'),
            ]
        }
    },
    house3L1( { x, y } ){
        var x = x + 1.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(14 + x, 2 + y, 'a2'),
                spawnPoint.new(2 + x, 11 + y, 'a3'),
                spawnPoint.new(2 + x, 14 + y, 'c1'),
                spawnPoint.new(2 + x, 19 + y, 'c2'),
                spawnPoint.new(10 + x, 14 + y, 'c3'),
                spawnPoint.new(10 + x, 19 + y, 'c4'),
                spawnPoint.new(2 + x, 22 + y, 'd1'),
                spawnPoint.new(2 + x, 33 + y, 'd2'),
                spawnPoint.new(10 + x, 22 + y, 'd3'),
                spawnPoint.new(10 + x, 33 + y, 'd4'),
                spawnPoint.new(2 + x, 36.5 + y, 'e1'),
                spawnPoint.new(2 + x, 40 + y, 'f1'),
                spawnPoint.new(2 + x, 53 + y, 'f2'),
                spawnPoint.new(14 + x, 53 + y, 'f3'),
            ]
        }
    },



    // HOUSE 2
    house2D1( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 8 + y, 'a1'),
                spawnPoint.new(2 + x, 14 + y, 'a2'),
                spawnPoint.new(12 + x, 14 + y, 'a3'),
                spawnPoint.new(2 + x, 2 + y, 'b1'),
                spawnPoint.new(2 + x, 5 + y, 'b2'),
                spawnPoint.new(8 + x, 5 + y, 'b3'),
                spawnPoint.new(33 + x, 2.5 + y, 'd1'),
                spawnPoint.new(15 + x, 6 + y, 'e1'),
                spawnPoint.new(15 + x, 14 + y, 'e2'),
                spawnPoint.new(21 + x, 14 + y, 'e3'),
                spawnPoint.new(21 + x, 6 + y, 'e4'),
                spawnPoint.new(24 + x, 6 + y, 'f1'),
                spawnPoint.new(24 + x, 14 + y, 'f2'),
                spawnPoint.new(33 + x, 14 + y, 'f3'),
                spawnPoint.new(33 + x, 6 + y, 'f4'),
            ]
        }
    },
    house2D2( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(33 + x, 8 + y, 'a1'),
                spawnPoint.new(33 + x, 14 + y, 'a2'),
                spawnPoint.new(23 + x, 14 + y, 'a3'),
                spawnPoint.new(33 + x, 2 + y, 'b1'),
                spawnPoint.new(33 + x, 5 + y, 'b2'),
                spawnPoint.new(27 + x, 5 + y, 'b3'),
                spawnPoint.new(2 + x, 2.5 + y, 'd1'),
                spawnPoint.new(14 + x, 6 + y, 'e1'),
                spawnPoint.new(14 + x, 14 + y, 'e2'),
                spawnPoint.new(20 + x, 14 + y, 'e3'),
                spawnPoint.new(20 + x, 6 + y, 'e4'),
                spawnPoint.new(11 + x, 6 + y, 'f1'),
                spawnPoint.new(11 + x, 14 + y, 'f2'),
                spawnPoint.new(2 + x, 14 + y, 'f3'),
                spawnPoint.new(2 + x, 6 + y, 'f4'),
            ]
        }
    },
    house2U1( { x, y } ){
        var x = x + 2.5, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(33 + x, 2 + y, 'a1'),
                spawnPoint.new(33 + x, 8 + y, 'a2'),
                spawnPoint.new(23 + x, 2 + y, 'a3'),
                spawnPoint.new(33 + x, 11 + y, 'b1'),
                spawnPoint.new(33 + x, 14 + y, 'b2'),
                spawnPoint.new(27 + x, 11 + y, 'b3'),
                spawnPoint.new(2 + x, 13.5 + y, 'd1'),
                spawnPoint.new(14 + x, 2 + y, 'e1'),
                spawnPoint.new(14 + x, 10 + y, 'e2'),
                spawnPoint.new(20 + x, 10 + y, 'e3'),
                spawnPoint.new(20 + x, 2 + y, 'e4'),
                spawnPoint.new(11 + x, 2 + y, 'f1'),
                spawnPoint.new(11 + x, 10 + y, 'f2'),
                spawnPoint.new(2 + x, 10 + y, 'f3'),
                spawnPoint.new(2 + x, 2 + y, 'f4'),
            ]
        }
    },
    house2U2( { x, y } ){
        var x = x + 2.5, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(2 + x, 8 + y, 'a2'),
                spawnPoint.new(12 + x, 2 + y, 'a3'),
                spawnPoint.new(2 + x, 11 + y, 'b1'),
                spawnPoint.new(2 + x, 14 + y, 'b2'),
                spawnPoint.new(8 + x, 11 + y, 'b3'),
                spawnPoint.new(33 + x, 13.5 + y, 'd1'),
                spawnPoint.new(15 + x, 2 + y, 'e1'),
                spawnPoint.new(15 + x, 10 + y, 'e2'),
                spawnPoint.new(21 + x, 10 + y, 'e3'),
                spawnPoint.new(21 + x, 2 + y, 'e4'),
                spawnPoint.new(24 + x, 2 + y, 'f1'),
                spawnPoint.new(24 + x, 10 + y, 'f2'),
                spawnPoint.new(33 + x, 10 + y, 'f3'),
                spawnPoint.new(33 + x, 2 + y, 'f4'),
            ]
        }
    },
    house2L1( { x, y } ){
        var x = x + 1.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(8 + x, 2 + y, 'a2'),
                spawnPoint.new(2 + x, 12 + y, 'a3'),
                spawnPoint.new(11 + x, 2 + y, 'b1'),
                spawnPoint.new(14 + x, 2 + y, 'b2'),
                spawnPoint.new(11 + x, 8 + y, 'b3'),
                spawnPoint.new(13.5 + x, 33 + y, 'd1'),
                spawnPoint.new(2 + x, 15 + y, 'e1'),
                spawnPoint.new(10 + x, 15 + y, 'e2'),
                spawnPoint.new(10 + x, 21 + y, 'e3'),
                spawnPoint.new(2 + x, 21 + y, 'e4'),
                spawnPoint.new(2 + x, 24 + y, 'f1'),
                spawnPoint.new(10 + x, 24 + y, 'f2'),
                spawnPoint.new(10 + x, 33 + y, 'f3'),
                spawnPoint.new(2 + x, 33 + y, 'f4'),
            ]
        }
    },
    house2L2( { x, y } ){
        var x = x + 1.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 33 + y, 'a1'),
                spawnPoint.new(8 + x, 33 + y, 'a2'),
                spawnPoint.new(2 + x, 23 + y, 'a3'),
                spawnPoint.new(11 + x, 33 + y, 'b1'),
                spawnPoint.new(14 + x, 33 + y, 'b2'),
                spawnPoint.new(11 + x, 27 + y, 'b3'),
                spawnPoint.new(13.5 + x, 2 + y, 'd1'),
                spawnPoint.new(2 + x, 14 + y, 'e1'),
                spawnPoint.new(10 + x, 14 + y, 'e2'),
                spawnPoint.new(10 + x, 20 + y, 'e3'),
                spawnPoint.new(2 + x, 20 + y, 'e4'),
                spawnPoint.new(2 + x, 11 + y, 'f1'),
                spawnPoint.new(10 + x, 11 + y, 'f2'),
                spawnPoint.new(10 + x, 2 + y, 'f3'),
                spawnPoint.new(2 + x, 2 + y, 'f4'),
            ]
        }
    },
    house2R1( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(14 + x, 33 + y, 'a1'),
                spawnPoint.new(8 + x, 33 + y, 'a2'),
                spawnPoint.new(14 + x, 23 + y, 'a3'),
                spawnPoint.new(5 + x, 33 + y, 'b1'),
                spawnPoint.new(2 + x, 33 + y, 'b2'),
                spawnPoint.new(5 + x, 27 + y, 'b3'),
                spawnPoint.new(2.5 + x, 2 + y, 'd1'),
                spawnPoint.new(14 + x, 14 + y, 'e1'),
                spawnPoint.new(6 + x, 14 + y, 'e2'),
                spawnPoint.new(6 + x, 20 + y, 'e3'),
                spawnPoint.new(14 + x, 20 + y, 'e4'),
                spawnPoint.new(14 + x, 11 + y, 'f1'),
                spawnPoint.new(6 + x, 11 + y, 'f2'),
                spawnPoint.new(6 + x, 2 + y, 'f3'),
                spawnPoint.new(14 + x, 2 + y, 'f4'),
            ]
        }
    },
    house2R2( { x, y } ){
        var x = x + 2.5, y = y + 2.5
        return {
            spawnPoints: [
                spawnPoint.new(14 + x, 2 + y, 'a1'),
                spawnPoint.new(8 + x, 2 + y, 'a2'),
                spawnPoint.new(14 + x, 12 + y, 'a3'),
                spawnPoint.new(5 + x, 2 + y, 'b1'),
                spawnPoint.new(2 + x, 2 + y, 'b2'),
                spawnPoint.new(5 + x, 8 + y, 'b3'),
                spawnPoint.new(2.5 + x, 33 + y, 'd1'),
                spawnPoint.new(14 + x, 15 + y, 'e1'),
                spawnPoint.new(6 + x, 15 + y, 'e2'),
                spawnPoint.new(6 + x, 21 + y, 'e3'),
                spawnPoint.new(14 + x, 21 + y, 'e4'),
                spawnPoint.new(14 + x, 24 + y, 'f1'),
                spawnPoint.new(6 + x, 24 + y, 'f2'),
                spawnPoint.new(6 + x, 33 + y, 'f3'),
                spawnPoint.new(14 + x, 33 + y, 'f4'),
            ]
        }
    },




    // HOUSE 1
    house1L1( { x, y } ){
        var x = x + 1.5, y = y + 2
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 7 + y, 'a1'),
                spawnPoint.new(2 + x, 14 + y, 'a2'),
                spawnPoint.new(8 + x, 14 + y, 'a3'),
                spawnPoint.new(2 + x, 2 + y, 'b1'),
                spawnPoint.new(2 + x, 4 + y, 'b2'),
                spawnPoint.new(15 + x, 2 + y, 'c1'),
                spawnPoint.new(15 + x, 9 + y, 'c2'),
                spawnPoint.new(11 + x, 9 + y, 'c3'),
            ]
        }
    },
    house1L2( { x, y } ){
        var x = x + 1.5, y = y + 2
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 2 + y, 'a1'),
                spawnPoint.new(2 + x, 9 + y, 'a2'),
                spawnPoint.new(8 + x, 2 + y, 'a3'),
                spawnPoint.new(2 + x, 12 + y, 'b1'),
                spawnPoint.new(2 + x, 14 + y, 'b2'),
                spawnPoint.new(15 + x, 14 + y, 'c1'),
                spawnPoint.new(15 + x, 7 + y, 'c2'),
                spawnPoint.new(11 + x, 7 + y, 'c3'),
            ]
        }
    },
    house1R1( { x, y } ){
        var x = x + 1.5, y = y + 2
        return {
            spawnPoints: [
                spawnPoint.new(15 + x, 2 + y, 'a1'),
                spawnPoint.new(15 + x, 9 + y, 'a2'),
                spawnPoint.new(9 + x, 2 + y, 'a3'),
                spawnPoint.new(15 + x, 12 + y, 'b1'),
                spawnPoint.new(15 + x, 14 + y, 'b2'),
                spawnPoint.new(2 + x, 14 + y, 'c1'),
                spawnPoint.new(2 + x, 7 + y, 'c2'),
                spawnPoint.new(6 + x, 7 + y, 'c3'),
            ]
        }
    },
    house1R2( { x, y } ){
        var x = x + 1.5, y = y + 2
        return {
            spawnPoints: [
                spawnPoint.new(15 + x, 7 + y, 'a1'),
                spawnPoint.new(15 + x, 14 + y, 'a2'),
                spawnPoint.new(9 + x, 14 + y, 'a3'),
                spawnPoint.new(15 + x, 2 + y, 'b1'),
                spawnPoint.new(15 + x, 4 + y, 'b2'),
                spawnPoint.new(2 + x, 9 + y, 'c1'),
                spawnPoint.new(2 + x, 2 + y, 'c2'),
                spawnPoint.new(6 + x, 9 + y, 'c3'),
            ]
        }
    },
    house1D1( { x, y } ){
        var x = x + 2, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(14 + x, 9 + y, 'a1'),
                spawnPoint.new(14 + x, 15 + y, 'a2'),
                spawnPoint.new(7 + x, 15 + y, 'a3'),
                spawnPoint.new(2 + x, 15 + y, 'b1'),
                spawnPoint.new(4 + x, 15 + y, 'b2'),
                spawnPoint.new(9 + x, 6 + y, 'c1'),
                spawnPoint.new(2 + x, 2 + y, 'c2'),
                spawnPoint.new(9 + x, 2 + y, 'c3'),
            ]
        }
    },
    house1D2( { x, y } ){
        var x = x + 2, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 9 + y, 'a1'),
                spawnPoint.new(2 + x, 15 + y, 'a2'),
                spawnPoint.new(9 + x, 15 + y, 'a3'),
                spawnPoint.new(12 + x, 15 + y, 'b1'),
                spawnPoint.new(14 + x, 15 + y, 'b2'),
                spawnPoint.new(7 + x, 6 + y, 'c1'),
                spawnPoint.new(7 + x, 2 + y, 'c2'),
                spawnPoint.new(14 + x, 2 + y, 'c3'),
            ]
        }
    },
    house1U1( { x, y } ){
        var x = x + 2, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(2 + x, 8 + y, 'a1'),
                spawnPoint.new(2 + x, 2 + y, 'a2'),
                spawnPoint.new(9 + x, 2 + y, 'a3'),
                spawnPoint.new(12 + x, 2 + y, 'b1'),
                spawnPoint.new(14 + x, 2 + y, 'b2'),
                spawnPoint.new(7 + x, 15 + y, 'c1'),
                spawnPoint.new(7 + x, 11 + y, 'c2'),
                spawnPoint.new(14 + x, 15 + y, 'c3'),
            ]
        }
    },
    house1U2( { x, y } ){
        var x = x + 2, y = y + 1.5
        return {
            spawnPoints: [
                spawnPoint.new(14 + x, 8 + y, 'a1'),
                spawnPoint.new(7 + x, 2 + y, 'a2'),
                spawnPoint.new(14 + x, 2 + y, 'a3'),
                spawnPoint.new(2 + x, 2 + y, 'b1'),
                spawnPoint.new(4 + x, 2 + y, 'b2'),
                spawnPoint.new(2 + x, 15 + y, 'c1'),
                spawnPoint.new(9 + x, 15 + y, 'c2'),
                spawnPoint.new(9 + x, 11 + y, 'c3'),
            ]
        }
    },

}

var spawnPoint = {
    type: 'spawnPoint',
    init(...infos){
        this.x = infos[0]
        this.y = infos[1]

        this.tag = infos[2]

        return this
    },
    new(...infos){
        return Object.create(this).init(...infos)
    },
}

var house = {
    colors: [

        // WALL,     ROOF,       FLOOR
        ['#191919', '#44382b', '#2b443d'],
        ['#828282', '#421f2e', '#2a5859'],
        ['#3f2916', '#3b3d3f', '#90937d'],
        ['#1e1610', '#141914', '#333']
    ],
    type: 'house',
    init( { x, y, houseType, tileX, tileY } ){
        this.id = uID.generate('house', 3)

        this.colorIndex = randFloor(this.colors.length)

        this.tileX = tileX
        this.tileY = tileY

        this.houseType = houseType

        var fresh = makeHouse[houseType]( { 
            x, 
            y, 
        } )

        this.spawnPoints = fresh.spawnPoints

        this.items = []

        return this
    },
    new(houseObj){
        return Object.create(this).init(houseObj)
    },
}

var mapTile = {
    type: 'tile',
    strokeColor: 'blue',
    altStrokeColor: 'red',
    alt2StrokeColor: 'lime',
    init(info){
        this.x = info.x
        this.y = info.y

        this.tileX = info.x / 20
        this.tileY = info.y / 20

        this.holding = []

        this.items = []

        this.players = []

        return this
    },
    checkIfTileIsRoad(tile){
        return (tile.holding[0] && tile.holding[0].__proto__ == road)
    },
    new(info){
        return Object.create(this).init(info)
    },
    isHoldingHouse(){
        return this.holding[0]?.type == 'house'
    },
    getHouseOrLinkedHouse(){
        // return house if holding
        if (this.isHoldingHouse()) return this.holding[0]
        // return linked house if linked
        else if (
            this.linkedFrom &&
            map.tiles
                [this.linkedFrom[0]]
                [this.linkedFrom[1]]
                .isHoldingHouse()
        ){
            return (
                map.tiles
                    [this.linkedFrom[0]]
                    [this.linkedFrom[1]]
                    .holding[0]
            )
        }
    },
    addPlayerToTile(thePlayer){
        this.players.push(thePlayer)

        // console.log('added player to tile', this.tileX, this.tileY)
    },
    removePlayerFromTile(thePlayer){
        var index = this.players.indexOf(thePlayer)

        if (index == -1) return console.log('found no player when trying to remove from tile')

        this.players.splice(index, 1)

        // console.log('removed player from tile', this.tileX, this.tileY)
    },
}

var player = {
    init(obj){
        this.x = obj.x
        this.y = obj.y

        this.tileX = Math.floor(obj.x / map.tileSize)
        this.tileY = Math.floor(obj.y / map.tileSize)

        this.playerID = uID.generate('player')

        console.log('player created', this)

        map.tiles[this.tileX][this.tileY]
        .addPlayerToTile(this)

        return this
    },
    new(obj){ return Object.create(this).init(obj) },
    move( { x, y, under } ){
        this.x = x
        this.y = y
        this.under = under

        var tileX = Math.floor(x / map.tileSize)
        var tileY = Math.floor(y / map.tileSize)

        if (
            this.tileX != tileX ||
            this.tileY != tileY
        ) {
            map.tiles[this.tileX][this.tileY]
            .removePlayerFromTile(this)

            this.tileX = tileX
            this.tileY = tileY

            map.tiles[this.tileX][this.tileY]
            .addPlayerToTile(this)
        }
    },
    removePlayer(){
        map.tiles[this.tileX][this.tileY]
        .removePlayerFromTile(this)

        uID.remove('player', this.playerID)
    },
}

var map = {
    tileSize: 20,
    width: 200,
    height: 200,
    tiles: [],
    allHouses: [],
    allTrees: [],
    firstBox: true,
    
    allRoadsWS: [],
    allTreesWS: [],
    allHousesWS: [],
    wsObj: {},
    mapID: '',

    init(){
        this.generate()
        
        // let tile = this.tiles[1][1]
        // tile.holding.push( 
        //     house.new({
        //         x: tile.x,
        //         y: tile.y,
        //         houseType: 'house3L1',
        //         tileX: tile.tileX,
        //         tileY: tile.tileY
        //     })
        // )
        // map.allHouses.push(tile.holding[0])

        // tile.linkedTo = [[2, 1], [3, 1]]
        // this.tiles[2][1].linkedFrom = [1, 1]
        // this.tiles[3][1].linkedFrom = [1, 1]


        
        // tile = this.tiles[1][2]
        // tile.holding.push( 
        //     house.new({
        //         x: tile.x,
        //         y: tile.y,
        //         houseType: 'house1U1',
        //         tileX: tile.tileX,
        //         tileY: tile.tileY
        //     })
        // )
        // map.allHouses.push(tile.holding[0])

        // tile.linkedTo = [[5, 1], [6, 1]]
        // this.tiles[5][1].linkedFrom = [4, 1]
        // this.tiles[6][1].linkedFrom = [4, 1]

        return this
    },
    new(){
        return Object.create(this).init()
    },
    createAllTiles(){
        this.tiles = []

        for (var x = 0; x < this.width; x++){
            this.tiles.push([])
            for (var y = 0; y < this.height; y++){
                this.tiles[x].push(mapTile.new({
                    x: x * map.tileSize,
                    y: y * map.tileSize,
                }))
            }
        }
    },
    getTile(x, y){
        if (!map.tiles[x]) return
        return map.tiles[x][y]
    },
    getTilesAroundPlayer( { tileX, tileY } ){
        var allFoundTiles = []

        // check 5 before and after
        // in both directions
        for (let x = tileX - 5; x <= tileX + 5; x++) {
            for (let y = tileY - 5; y <= tileY + 5; y++) {

                let tile = map.getTile(x, y)
                if (tile) allFoundTiles.push(tile)
            }
        }

        return allFoundTiles
    },
    createCommunityBox(){
        var min = 3, 
            max = 20, 
            edgeGap = 10

        if (rand() > .9) {
            min = max = 3
        }
        else if (rand() > .8) {
            min = 4
            max = 6
        }

        if (map.firstBox) {
            max = 50
            min = 40
            map.firstBox = false
        }

        // create random size box
        var randomW = randFloor(min, max)
        var randomH = randFloor(min, max)

        // random box position, leaving 1 slot around edge guranteed
        var randomX = randFloor(edgeGap, this.width - randomW - edgeGap)
        var randomY = randFloor(edgeGap, this.height - randomH - edgeGap)

        return {
            x: randomX,
            y: randomY,
            width: randomW,
            height: randomH,
            centerX: Math.floor((randomX + (randomW / 2))),
            centerY: Math.floor((randomY + (randomH / 2))),
            shortestBoxes: [],
            linkedTo: [],
        }
    },
    createConnectingRoadOnTile(tile){
        tile.holding.push(
            road.new({
                x: tile.x,
                y: tile.y,
                connectingRoad: true
            })
        )
    },
    createCommunityZones(){
        var newBoxes = [],
            boxGapMin = 0,
            boxGapMax = 2,
            failCount = 0,
            id = 0

        while (newBoxes.length < 200) {
            let newBox = this.createCommunityBox(),
                testFailed = false

            newBoxes.forEach(box => {
                var boxGap = rand(boxGapMin, boxGapMax)
                if (newBox.x < box.x + box.width + boxGap &&
                    newBox.x + newBox.width + boxGap > box.x  &&
                    newBox.y < box.y + box.height + boxGap  &&
                    newBox.height + newBox.y  + boxGap > box.y
                ){
                    testFailed = true
                    failCount++
                }
            })
            if (failCount > 100) break
            if (testFailed) continue
            failCount = 0
            id++
            newBox.id = id
            newBoxes.push(newBox)
        }

        return newBoxes
    },
    createCommunityOuterRoads(newBoxes){
        newBoxes.forEach(newBox => {
            let forceConnectingRoad = false
            if (newBox.width == 3 && newBox.height == 3){
                this.tiles[newBox.x+1][newBox.y+1].soloCircle = true
                this.tiles[newBox.x+1][newBox.y+1].holding.push(tree.new({
                    x: newBox.x+1,
                    y: newBox.y+1,
                }))
                // dont allow houses on 3x3 communities (soloCircles)
                forceConnectingRoad = true
            }
            // create outer roads for box
            for (var x = newBox.x; x < newBox.x + newBox.width; x++){
                for (var y = newBox.y; y < newBox.y + newBox.height; y++){
                    if (
                        x >= newBox.x && 
                        x < newBox.x + newBox.width &&
                        y >= newBox.y &&
                        y < newBox.y + newBox.height &&
                            (x == newBox.x ||
                            y == newBox.y ||
                            x == newBox.x + newBox.width - 1 ||
                            y == newBox.y + newBox.height - 1)
                    ) {
                        let tile = this.tiles[x][y]
                        tile.holding.push(
                            road.new({
                                x: tile.x,
                                y: tile.y,
                                forceConnectingRoad
                            })
                        )
                    }
                    this.tiles[x][y].communityHold = true
                }
            }
        })
    },
    setCommunityShortestBoxes(newBoxes){
        newBoxes.forEach((box, boxIndex) => {
            let nonThisBox = newBoxes.filter(x => x != box)

            let temp = nonThisBox.map(nonBox => ({
                dist: (
                    (box.centerX - nonBox.centerX)**2 + 
                    (box.centerY - nonBox.centerY)**2)
                ,
                nonBox,
            })).sort((a, b) => a.dist < b.dist ? -1 : 1)

            // more connections for first (big) box
            let sliceAmt = boxIndex ? 3 : 10
            box.shortestBoxes = 
                temp.slice(0, sliceAmt)
                .map(distObj => distObj.nonBox)

            box.linkedTo = 
                box.shortestBoxes
                .map(shortBox => shortBox.id)
        })
    },
    createRoadsLinkingCommunities(newBoxes){
        newBoxes.forEach(box => {

                box.shortestBoxes.forEach(otherBox => {

                // if two communities are linked to each other
                // unlink them, and skip the first one
                // so there's only 1 road connecting them
                if (
                        box.linkedTo.includes(otherBox.id) && 
                        otherBox.linkedTo.includes(box.id)
                    ){
                        box.linkedTo = 
                            box.linkedTo
                            .filter(x=> x !== otherBox.id)

                        return
                    }

                var difX = otherBox.centerX - box.centerX,
                    difY = otherBox.centerY - box.centerY

                // first pass is horizontal
                // second pass is vertical

                // non-road is a skipped road 
                // due to other roads being around it already
                
                // this prevents roads doubling up next to each other

                // this variable tells the second pass if the first pass 
                // ended on a non-road due to neighboring roads

                // then, if the second pass ends on the first row
                // outside of the community, it skips

                // otherwise, you would get road doubling
                // next to the community road
                var endedOnOtherRoad = false

                // HORIZONTAL ROADS
                if (difX > 0){
                    let hasHitCommunityBorder = false,
                        justHitCommunityBorder = false,
                        hasHitOtherRoad = false

                    for (var x = 0; x <= difX; x++){
                        let tile = this.tiles[box.centerX + x][box.centerY]

                        // start building roads after leaving community zone
                        if (!hasHitCommunityBorder || tile.communityHold) {
                            if (tile.checkIfTileIsRoad(tile)) {
                                hasHitCommunityBorder = true
                                justHitCommunityBorder = true
                            }
                            continue
                        }

                        let tileAbove = this.tiles[box.centerX + x][box.centerY - 1],
                            tileBelow = this.tiles[box.centerX + x][box.centerY + 1]

                            // check for existing tiles at location and surrounding
                        if (
                                tile.checkIfTileIsRoad(tileAbove) ||
                                tile.checkIfTileIsRoad(tileBelow) ||
                                tile.holding.length
                            ){
                                // allow road for first neighbor road find
                                if (hasHitOtherRoad) continue
                                hasHitOtherRoad = true

                                // unless its the first tile outside of the community zone
                                if (justHitCommunityBorder) {
                                    justHitCommunityBorder = false
                                    continue
                                }
                                // don't place tile if it's already holding from another pass
                                if (tile.holding.length){
                                    continue
                                }
                        }
                        else {
                            // reset 'other road' collision check 
                            // once the path and surrounding are clear
                            // then, add previous tile if not already there
                            if (hasHitOtherRoad) {
                                hasHitOtherRoad = false
                                let previousTile = this.tiles[box.centerX + x - 1][box.centerY]
                                if (!previousTile.holding?.length){
                                    this.createConnectingRoadOnTile(previousTile)
                                }
                            }
                        }
                        if (justHitCommunityBorder) justHitCommunityBorder = false
                        this.createConnectingRoadOnTile(tile)
                    }
                    if (hasHitOtherRoad) {
                        endedOnOtherRoad = true
                    }
                }
                else if (difX < 0){
                    let hasHitCommunityBorder = false,
                        justHitCommunityBorder = false,
                        hasHitOtherRoad = false

                    for (var x = 0; x <= Math.abs(difX); x++){
                        let tile = this.tiles[box.centerX - x][box.centerY]

                        // start building roads after leaving community zone
                        if (!hasHitCommunityBorder || tile.communityHold) {
                            if (tile.checkIfTileIsRoad(tile)) {
                                hasHitCommunityBorder = 
                                justHitCommunityBorder = true
                            }
                            continue
                        }

                        let tileAbove = this.tiles[box.centerX - x][box.centerY - 1],
                            tileBelow = this.tiles[box.centerX - x][box.centerY + 1]

                            // check for existing tiles at location and surrounding
                        if (
                                tile.checkIfTileIsRoad(tileAbove) ||
                                tile.checkIfTileIsRoad(tileBelow) ||
                                tile.holding.length
                            ){
                                // allow road for first neighbor road find
                                if (hasHitOtherRoad) continue
                                hasHitOtherRoad = true

                                // unless its the first tile outside of the community zone
                                if (justHitCommunityBorder) {
                                    justHitCommunityBorder = false
                                    continue
                                }
                                // don't place tile if it's already holding
                                if (tile.holding.length){
                                    continue
                                }
                        }
                        else {
                            // reset 'other road' collision check 
                            // once the path and surrounding are clear
                            // then, add previous tile if not already there
                            if (hasHitOtherRoad) {
                                hasHitOtherRoad = false
                                let previousTile = this.tiles[box.centerX - x + 1][box.centerY]
                                if (!previousTile.holding?.length){
                                    this.createConnectingRoadOnTile(previousTile)
                                }
                            }
                        }
                        if (justHitCommunityBorder) justHitCommunityBorder = false
                        this.createConnectingRoadOnTile(tile)
                    }
                    if (hasHitOtherRoad) {
                        endedOnOtherRoad = true
                    }
                }

                // VERTICAL ROADS
                if (difY > 0){
                    let hasHitCommunityBorder = false,
                        justHitCommunityBorder = false,
                        hasHitOtherRoad = false

                    for (var y = 0; y <= difY; y++){
                        let tile = this.tiles[otherBox.centerX][otherBox.centerY - y]

                        if (justHitCommunityBorder && difY == y && endedOnOtherRoad){
                            break
                        }

                        // start building roads after leaving community zone
                        if (!hasHitCommunityBorder || tile.communityHold) {
                            if (tile.checkIfTileIsRoad(tile)) {
                                hasHitCommunityBorder = 
                                justHitCommunityBorder = true
                            }
                            continue
                        }

                        let tileLeft = this.tiles[otherBox.centerX - 1][otherBox.centerY - y],
                            tileRight = this.tiles[otherBox.centerX + 1][otherBox.centerY - y]

                        // check for existing tiles at location and surrounding
                        if (
                                tile.checkIfTileIsRoad(tileLeft) ||
                                tile.checkIfTileIsRoad(tileRight) ||
                                tile.holding.length
                            ){
                                // allow road for first neighbor road find
                                if (hasHitOtherRoad) continue
                                hasHitOtherRoad = true

                                // unless its the first tile outside of the community zone
                                if (justHitCommunityBorder) {
                                    justHitCommunityBorder = false
                                    continue
                                }
                                // don't place tile if it's already holding
                                if (tile.holding.length){
                                    continue
                                }
                        }
                        else {
                            // reset 'other road' collision check 
                            // once the path and surrounding are clear
                            // then, add previous tile if not already there
                            if (hasHitOtherRoad) {
                                hasHitOtherRoad = false
                                let previousTile = this.tiles[otherBox.centerX][otherBox.centerY - y + 1]
                                if (!previousTile.holding?.length){
                                    this.createConnectingRoadOnTile(previousTile)
                                }
                            }
                        }
                        if (justHitCommunityBorder) justHitCommunityBorder = false
                        this.createConnectingRoadOnTile(tile)
                    }
                }
                else if (difY < 0){
                    let hasHitCommunityBorder = false,
                        justHitCommunityBorder = false,
                        hasHitOtherRoad = false

                    for (var y = 0; y <= Math.abs(difY); y++){
                        let tile = this.tiles[otherBox.centerX][otherBox.centerY + y]

                        if (justHitCommunityBorder &&  Math.abs(difY) == y && endedOnOtherRoad){
                            break
                        }

                        // start building roads after leaving community zone
                        if (!hasHitCommunityBorder || tile.communityHold) {
                            if (tile.checkIfTileIsRoad(tile)) {
                                hasHitCommunityBorder = 
                                justHitCommunityBorder = true
                            }
                            continue
                        }

                        let tileLeft = this.tiles[otherBox.centerX - 1][otherBox.centerY + y],
                            tileRight = this.tiles[otherBox.centerX + 1][otherBox.centerY + y]

                        // check for existing tiles at location and surrounding
                        if (
                                tile.checkIfTileIsRoad(tileLeft) ||
                                tile.checkIfTileIsRoad(tileRight) ||
                                tile.holding.length
                            ){
                                // allow road for first neighbor road find
                                if (hasHitOtherRoad) continue
                                hasHitOtherRoad = true

                                // unless its the first tile outside of the community zone
                                if (justHitCommunityBorder) {
                                    justHitCommunityBorder = false
                                    continue
                                }
                                // don't place tile if it's already holding
                                if (tile.holding.length){
                                    continue
                                }
                        }
                        else {
                            // reset 'other road' collision check 
                            // once the path and surrounding are clear
                            // then, add previous tile if not already there
                            if (hasHitOtherRoad) {
                                hasHitOtherRoad = false
                                let previousTile = this.tiles[otherBox.centerX][otherBox.centerY + y - 1]
                                if (!previousTile.holding?.length){
                                    this.createConnectingRoadOnTile(previousTile)
                                }
                            }
                        }
                        if (justHitCommunityBorder) justHitCommunityBorder = false
                        this.createConnectingRoadOnTile(tile)
                    }
                }
            })
        })
    },
    cleanUpDeadEndRoads(){
        // clears dead end roads
        // IE roads that are only connected on one side
        // diagonal doesn't count, only up down left right

        function getConnectedRoads(x, y){
            connectedRoads = []
            if (map.tiles[x - 1][y].holding[0]) 
                connectedRoads.push( {x: -1, y: 0} ) // left

            if (map.tiles[x + 1][y].holding[0]) 
                connectedRoads.push( {x: 1, y: 0} ) // right

            if (map.tiles[x][y - 1].holding[0]) 
                connectedRoads.push( {x: 0, y: -1} ) // up

            if (map.tiles[x][y + 1].holding[0]) 
                connectedRoads.push( {x: 0, y: 1} ) // down

            return connectedRoads
        }

        var allRoads = 
                map.tiles.reduce((a, c) => 
                    a.concat(c.filter(tile => 
                            tile.holding[0]?.type == 'road'
                    ))
                , [])

        for (var i = 0, length = allRoads.length; i < length; i++) {
            if (!allRoads[i].holding[0]) continue
            let firstPass = true,
                tileX = allRoads[i].x / map.tileSize,
                tileY = allRoads[i].y / map.tileSize,
                connectedRoads = getConnectedRoads(tileX, tileY)

            while (connectedRoads.length <= 1) {
                let currentTile = map.tiles[tileX][tileY]
                
                firstPass = false

                currentTile.holding.pop()

                if (!connectedRoads.length) break

                tileX += connectedRoads[0].x
                tileY += connectedRoads[0].y
                
                connectedRoads = getConnectedRoads(tileX, tileY)
            }
        }
    },
    setAllCornerRoads(){
        for (var x = 0, lengthX = this.tiles.length; x < lengthX; x++){
            for (var y = 0, lengthY = this.tiles[x].length; y < lengthY; y++){
                let tileHolding = this.tiles[x][y].holding[0]
                if (tileHolding){
                    if (
                        !this.tiles[x][y - 1].holding[0] && 
                        !this.tiles[x + 1][y].holding[0] && 
                        this.tiles[x][y + 1].holding[0] &&
                        this.tiles[x - 1][y].holding[0]
                    )
                    tileHolding.corner = 'top right'
                        
                    else if (
                        !this.tiles[x][y - 1].holding[0] && 
                        this.tiles[x + 1][y].holding[0] && 
                        this.tiles[x][y + 1].holding[0] &&
                        !this.tiles[x - 1][y].holding[0]
                    )
                    tileHolding.corner = 'top left'

                    else if (
                        this.tiles[x][y - 1].holding[0] && 
                        this.tiles[x + 1][y].holding[0] && 
                        !this.tiles[x][y + 1].holding[0] &&
                        !this.tiles[x - 1][y].holding[0]
                    )
                    tileHolding.corner = 'bottom left'

                    else if (
                        this.tiles[x][y - 1].holding[0] && 
                        !this.tiles[x + 1][y].holding[0] && 
                        !this.tiles[x][y + 1].holding[0] &&
                        this.tiles[x - 1][y].holding[0]
                    )
                    tileHolding.corner = 'bottom right'
                }
            }
        }
    },
    createCommunityInnerRoads(newBoxes){
        function randomChanceToDeleteRoadBlocksForVariety(i){
            // deletes differently for 0 index
            // which is the first (biggest) community
            return (rand() > (!i ? .98 : .94))
        }

        newBoxes.forEach((newBox, i) => {

            // create inner road columns
            var lastCol = newBox.x
            for (var x = newBox.x + 1; x < newBox.x + newBox.width - 3; x++){
                if (x - lastCol < 3 || Math.random() < .7) continue
                lastCol = x
                for (var y = newBox.y; y < newBox.y + newBox.height; y++){
                    if (randomChanceToDeleteRoadBlocksForVariety(i)) continue
                    let tile = this.tiles[x][y]
                    if (tile.holding.length) continue
                    tile.holding.push(
                            road.new({
                            x: tile.x,
                            y: tile.y,
                        })
                    )
                } 
            }

            // create inner road columns
            var lastRow = newBox.y
            for (var y = newBox.y + 1; y < newBox.y + newBox.height - 3; y++){
                if (y - lastRow < 3 || Math.random() < .7) continue
                lastRow = y
                for (var x = newBox.x; x < newBox.x + newBox.width; x++){
                    if (randomChanceToDeleteRoadBlocksForVariety(i)) continue
                    let tile = this.tiles[x][y]
                    if (tile.holding.length) continue
                    tile.holding.push(
                            road.new({
                            x: tile.x,
                            y: tile.y,
                        })
                    )
                } 
            }
        })
    },
    randomPlaceHouses(){
        this.allHouses = []

        var globalChance = 1,

            house1Chance = .2 * globalChance,
            house2Chance = .1 * globalChance,
            house3Chance = .05 * globalChance

        function validateNonCornerNonConnectingRoads(...args){
            // checks [x, y] of every [] passed
            var testPassed = true
            for (var i = 0, length = args.length; i < length; i++){
                if (!(
                    map.tiles[args[i][0]][args[i][1]].holding[0] &&
                    map.tiles[args[i][0]][args[i][1]].holding[0].__proto__ == road &&
                    !map.tiles[args[i][0]][args[i][1]].holding[0].corner &&
                    !map.tiles[args[i][0]][args[i][1]].holding[0].connectingRoad
                )) {
                    testPassed = false
                    break
                }
            }
            return testPassed
        }
        function validateTilesNotHoldingOrLinked(...args){
            // checks [x, y] of every [] passed
            var testPassed = true
            for (var i = 0, length = args.length; i < length; i++){

                let tile = map.tiles[args[i][0]][args[i][1]]

                if (tile.holding[0] || tile.linkedFrom) {
                    testPassed = false
                    break
                }
            }
            return testPassed
        }
        function addHouseToTile(tile, houseType){
            tile.holding.push(
                house.new({
                    x: tile.x, 
                    y: tile.y, 
                    houseType,
                    tileX: tile.tileX,
                    tileY: tile.tileY,
                })
            )
            map.allHouses.push(tile.holding[0])
        }

        // create top houses
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){
                if (
                        validateNonCornerNonConnectingRoads([x, y]) &&
                        validateTilesNotHoldingOrLinked([x, y - 1])
                    ){
                    if (rand() > house1Chance) continue
                    addHouseToTile(
                        this.tiles[x][y - 1], 
                        `house1D${randFloor(1, 3)}`
                    )
                }
            }
        }
        // create bottom houses
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){
                if (
                        validateNonCornerNonConnectingRoads([x, y]) &&
                        validateTilesNotHoldingOrLinked([x, y + 1])
                    ){
                    if (rand() > house1Chance) continue
                    addHouseToTile(
                        this.tiles[x][y + 1], 
                        `house1U${randFloor(1, 3)}`
                    )
                }
            }
        }
        // create left houses
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){
                if (
                        validateNonCornerNonConnectingRoads([x, y]) &&
                        validateTilesNotHoldingOrLinked([x + 1, y])
                    ){
                    if (rand() > house1Chance) continue
                    addHouseToTile(
                        this.tiles[x + 1][y], 
                        `house1L${randFloor(1, 3)}`
                    )
                }
            }
        }
        // create right houses
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){
                if (
                        validateNonCornerNonConnectingRoads([x, y]) &&
                        validateTilesNotHoldingOrLinked([x - 1, y])
                    ){
                    if (rand() > house1Chance) continue
                    addHouseToTile(
                        this.tiles[x - 1][y], 
                        `house1R${randFloor(1, 3)}`
                    )
                }
            }
        }

        // create DOWN house2
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                        validateNonCornerNonConnectingRoads([x, y], [x + 1, y]) &&
                        validateTilesNotHoldingOrLinked([x, y - 1], [x + 1, y - 1])
                    ){

                    if (rand() > house2Chance) continue

                    let tile = this.tiles[x][y - 1]
                    
                    addHouseToTile(tile, `house2D${randFloor(1, 3)}`)
                    
                    tile.linkedTo = [[x + 1, y - 1]]
                    this.tiles[x + 1][y - 1].linkedFrom = [x, y - 1]
                }
            }
        }
        // create UP house2
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                        validateNonCornerNonConnectingRoads([x, y], [x + 1, y]) &&
                        validateTilesNotHoldingOrLinked([x, y + 1], [x + 1, y + 1])
                    ){

                    if (rand() > house2Chance) continue

                    let tile = this.tiles[x][y + 1]
                    
                    addHouseToTile(tile, `house2U${randFloor(1, 3)}`)
                    
                    tile.linkedTo = [[x + 1, y + 1]]
                    this.tiles[x + 1][y + 1].linkedFrom = [x, y + 1]
                }
            }
        }
        // create LEFT house2
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                        validateNonCornerNonConnectingRoads([x, y], [x, y + 1]) &&
                        validateTilesNotHoldingOrLinked([x + 1, y], [x + 1, y + 1])
                    ){

                    if (rand() > house2Chance) continue

                    let tile = this.tiles[x + 1][y]
                    
                    addHouseToTile(tile, `house2L${randFloor(1, 3)}`)

                    tile.linkedTo = [[x + 1, y + 1]]
                    this.tiles[x + 1][y + 1].linkedFrom = [x + 1, y]
                }
            }
        }
        // create RIGHT house2
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                    validateNonCornerNonConnectingRoads([x, y], [x, y + 1]) &&
                    validateTilesNotHoldingOrLinked([x - 1, y], [x - 1, y + 1])
                ){

                    if (rand() > house2Chance) continue

                    let tile = this.tiles[x - 1][y]
                    
                    addHouseToTile(tile, `house2R${randFloor(1, 3)}`)
                    
                    tile.linkedTo = [[x - 1, y + 1]]
                    this.tiles[x - 1][y + 1].linkedFrom = [x - 1, y]
                }
            }
        }
        
        // door DOWN house3
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                    validateNonCornerNonConnectingRoads([x, y], [x + 1, y], [x + 2, y]) &&
                    validateTilesNotHoldingOrLinked([x, y - 1], [x + 1, y - 1], [x + 2, y - 1])
                ){

                    if (rand() > house3Chance) continue

                    let tile = this.tiles[x][y - 1]
                    
                    addHouseToTile(tile, `house3D1`)
                    
                    tile.linkedTo = [[x + 1, y - 1], [x + 2, y - 1]]
                    this.tiles[x + 1][y - 1].linkedFrom = [x, y - 1]
                    this.tiles[x + 2][y - 1].linkedFrom = [x, y - 1]
                }
            }
        }
        // door UP house3
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                    validateNonCornerNonConnectingRoads([x, y], [x + 1, y], [x + 2, y]) &&
                    validateTilesNotHoldingOrLinked([x, y + 1], [x + 1, y + 1], [x + 2, y + 1])
                ){

                    if (rand() > house3Chance) continue

                    let tile = this.tiles[x][y + 1]
                    
                    addHouseToTile(tile, `house3U1`)
                    
                    tile.linkedTo = [[x + 1, y + 1], [x + 2, y + 1]]
                    this.tiles[x + 1][y + 1].linkedFrom = [x, y + 1]
                    this.tiles[x + 2][y + 1].linkedFrom = [x, y + 1]
                }
            }
        }
        // door LEFT house3
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                    validateNonCornerNonConnectingRoads([x, y], [x, y + 1], [x, y + 2]) &&
                    validateTilesNotHoldingOrLinked([x + 1, y], [x + 1, y + 1], [x + 1, y + 2])
                ){

                    if (rand() > house3Chance) continue

                    let tile = this.tiles[x + 1][y]
                    
                    addHouseToTile(tile, `house3L1`)

                    tile.linkedTo = [[x + 1, y + 1], [x + 1, y + 2]]
                    this.tiles[x + 1][y + 1].linkedFrom = [x + 1, y]
                    this.tiles[x + 1][y + 2].linkedFrom = [x + 1, y]
                }
            }
        }
        // door RIGHT house3
        for (var x = 0; x < this.tiles.length; x++){
            for (var y = 0; y < this.tiles[x].length; y++){

                if (
                    validateNonCornerNonConnectingRoads([x, y], [x, y + 1], [x, y + 2]) &&
                    validateTilesNotHoldingOrLinked([x - 1, y], [x - 1, y + 1], [x - 1, y + 2])
                ){

                    if (rand() > house3Chance) continue

                    let tile = this.tiles[x - 1][y]
                    
                    addHouseToTile(tile, `house3R1`)

                    tile.linkedTo = [[x - 1, y + 1], [x - 1, y + 2]]
                    this.tiles[x - 1][y + 1].linkedFrom = [x - 1, y]
                    this.tiles[x - 1][y + 2].linkedFrom = [x - 1, y]
                }
            }
        }
    },
    randomPlaceTrees(){
        this.allTrees = []
        
        var allEmptyTiles = 
            map.tiles.reduce((a, c) =>
                a.concat(c.filter(tile =>
                    !tile.holding[0] && !tile.linkedFrom
                ))
            , [])

        var edgeGap = 13 * map.tileSize
        for (var i = 0, length = allEmptyTiles.length; i < length; i++) {
            let tile = allEmptyTiles[i]
            if (
                tile.x < edgeGap ||
                tile.x > map.width * map.tileSize - edgeGap ||
                tile.y < edgeGap ||
                tile.y > map.height * map.tileSize - edgeGap
                ) continue

            if (rand() > .99) {
                tile.holding.push(tree.new({
                    x: tile.x/20,
                    y: tile.y/20
                }))
                this.allTrees.push(tile.holding[0])
            }
        }
    },
    pickRandomPlayerSpawnPoint(){
        var allRoads = 
            this.tiles.reduce((a, c) =>
                a.concat(c.filter(tile =>
                    tile.holding[0]?.type == 'road'
                    ))
            , [])

        var tile = allRoads[randFloor(allRoads.length)]

        // center of tile
        return [
            tile.x + map.tileSize / 2,
            tile.y + map.tileSize / 2
        ]
    },
    generateLootSpawns(){
        var all = this.allHouses

        for (var i = 0, length = all.length; i < length; i++) {

            // some houses don't get loot
            if (rand() > .5) continue

            var tempSpawnArray = [...all[i].spawnPoints],
                spawnMax = Math.floor(tempSpawnArray.length / 2),
                spawnCount = randFloor(1, spawnMax)

            // houses with loot get only 1 loot sometimes
            if (rand() > .5) spawnCount = 1

            for (let j = spawnCount; j; j--) {
                let randomSpawnIndex = randFloor(tempSpawnArray.length),
                    sp = tempSpawnArray[randomSpawnIndex],
                    tag = sp.tag[0]

                all[i].items.push(
                    item.new({
                        itemType: 'water',
                        x: sp.x,
                        y: sp.y,
                        tileX: all[i].tileX,
                        tileY: all[i].tileY,
                        tag,
                    })
                )
                tempSpawnArray.splice(randomSpawnIndex, 1)
            }
        }
    },
    generate(){
        this.createAllTiles()

        map.firstBox = true

        var newBoxes = this.createCommunityZones()

        this.createCommunityOuterRoads(newBoxes)

        this.setCommunityShortestBoxes(newBoxes)

        this.createRoadsLinkingCommunities(newBoxes)

        this.createCommunityInnerRoads(newBoxes)

        this.cleanUpDeadEndRoads()

        this.setAllCornerRoads()

        this.randomPlaceHouses()

        this.randomPlaceTrees()

        this.generateLootSpawns()


        this.setWSObj()
    },


    setWSObj(){
        this.setMapID()

        this.setAllRoadsWS()
        this.setAllTreesWS()
        this.setAllHousesWS()

        this.wsObj = {
            r: this.allRoadsWS,
            h: this.allHousesWS,
            t: this.allTreesWS,
            id: this.mapID
        }
    },
    setMapID(){
        if (this.mapID) uID.remove('map', this.mapID)
        this.mapID = uID.generate('map')
    },
    setAllHousesWS(){
        // turn all houses
        // into array of strings
        // format : 'x y type colorIndex'

        this.allHousesWS = this.allHouses.map(house => {
            // var newString = ''
            // newString += house.tileX
            // newString += ' ' + house.tileY
            // newString += ' ' + house.houseType.substr(5)
            // newString += ' ' + house.colorIndex
            // return newString


            return (
                `${house.tileX} ${house.tileY} ` + 
                `${house.houseType.substr(5)} ` +
                `${house.colorIndex} ${house.id}`
            )
        })
    },
    setAllTreesWS(){
        // turn tiles holding trees
        // into array of strings
        // format: 'x y'

        var allTreeTiles = 
            map.tiles.reduce((a, c) =>
                a.concat(c.filter(tile =>
                    tile.holding[0] && tile.holding[0].__proto__ == tree
                ))
            , [])

        this.allTreesWS = allTreeTiles.map(tile => {
            var newString = ''
            newString += tile.tileX
            newString += ' ' + tile.tileY
            return newString
        })
    },
    setAllRoadsWS(){
        var allRoadTiles = 
            map.tiles.reduce((a, c) =>
                a.concat(c.filter(tile =>
                    tile.holding[0] && tile.holding[0].__proto__ == road
                ))
            , [])

        // turn tile objects into road objects
        // and clear keys of undefined values
        
        this.allRoadsWS = 
            allRoadTiles.map(tile => {
                return (
                    Object.entries(tile.holding[0])
                    .filter(([key, value]) => value)
                    .reduce((obj, [key, value]) => {
                        return Object.assign(obj, {
                            [key]: value
                        })
                    }, {})
                )
            })

        // minimize data
        // reduce x and y to tileX tileY
        // remove connectingRoad which is only needed for house placing
        
        // make them into strings to save characters when JSONing
        // format is 'x y' and then ' dir' if it's a corner

        this.allRoadsWS = 
            this.allRoadsWS.map(road => {
                objToString = ''

                objToString += road.x / map.tileSize
                objToString += ' ' + road.y / map.tileSize

                if (road.corner) {
                    let dir = 
                        road.corner.split(' ')
                            .reduce((a, c) => a + c[0], '')

                    objToString += ' ' + dir
                }
                return objToString
            })
    },
}
map.init()

module.exports = {
    get getMap() { return map.wsObj },
    get id() { return map.mapID },
    getRandomSpawnPoint(){
        return map.pickRandomPlayerSpawnPoint()
    },
    createPlayer(obj) {
        return player.new(obj)
    },
    getTile: map.getTile,
    getTilesAroundPlayer: map.getTilesAroundPlayer
}