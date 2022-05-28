addEventListener('DOMContentLoaded', init, { once: true })

const OPTIONS = {
    COLORS: {
        mapBG: '#102010',
        mapBGWithGrass: '#102910',
        road: '#404444'
    },
    DEV: {
        DEBUG: {
            // player stuff
            SPAWN_IN_CORNER: 0,

            // house stuff
            SHOW_HOUSE_ROOFS: 1,
            SHOW_MAIN_COLLISION: 0,
            SHOW_HOUSE_ITEM_SPAWN_POINTS: 0,
            SHOW_HOUSE_ITEM_ZONES: 0,

            // dead end roads removed highlighting
            HIGHLIGHT_REMOVED_TILES: 0,

        },
        // clearing all highlights with Z keypress
        clearAllHighlights: (function clearHighlightsWrap(){
            addEventListener('keydown', handleKeyDown)
            function handleKeyDown(e){
                var didRemoveHighlight = false
                if (e.key.toLowerCase() == 'z') {
                    map.tiles.reduce((a, c) => 
                        a.concat(
                            c.filter(tile => 
                                (tile.debug.highlight || 
                                tile.debug.altHighlight ||
                                tile.debug.alt2Highlight)
                            )
                        )
                    , [])
                    .forEach(tile => {
                        tile.debug.highlight = 
                        tile.debug.altHighlight = 
                        tile.debug.alt2Highlight = 
                            false

                        didRemoveHighlight = true
                    })
                }
                if (zoom.current > 5 && didRemoveHighlight) animate()
            }
        })()
    }
}

const dbg = (function debugWrap(){
    function getTileFromClick(e){
        return [
            Math.floor(thePlayer.x / map.tileSize + pxToVmax( e.x -  (canvas.width / 2)  ) / map.tileSize ),
            Math.floor(thePlayer.y / map.tileSize + pxToVmax( e.y -  (canvas.height / 2)  ) / map.tileSize )
        ]
    }
    function goTo(x, y){
        if (zoom.current == 80) {
            thePlayer.preZoomedX = x * map.tileSize + map.tileSize / 2
            thePlayer.preZoomedY = y * map.tileSize + map.tileSize / 2
        }
        else {
            thePlayer.x = x * map.tileSize + map.tileSize / 2
            thePlayer.y = y * map.tileSize + map.tileSize / 2
        }
    }
    function highlightTile(x, y){
        if (map.tiles[x][y].debug.altHighlight)
            map.tiles[x][y].debug.altHighlight = false

        map.tiles[x][y].debug.highlight = 
            !map.tiles[x][y].debug.highlight
    }
    function alternateHighlightTile(x, y){
        if (map.tiles[x][y].debug.highlight)
            map.tiles[x][y].debug.highlight = false

        map.tiles[x][y].debug.altHighlight = 
            !map.tiles[x][y].debug.altHighlight
    }
    function highlightFromClick(e){
        var [xTile, yTile] = getTileFromClick(e)

        if (!map.tiles[xTile] || !map.tiles[xTile][yTile]) return

        if (zoom.current > 5) animate()

        if (map.tiles[xTile][yTile].debug.highlightClickID == e.clickID) return
        map.tiles[xTile][yTile].debug.highlightClickID = e.clickID

        if (e.button == 2 || e.buttonOverride == 2) return alternateHighlightTile(xTile, yTile)

        highlightTile(xTile, yTile)
    }
    function goToFromClick(e){
        var [xTile, yTile] = getTileFromClick(e)
        goTo(xTile, yTile)
        animate()
    }
    function logTileFromClick(e){
        var [xTile, yTile] = getTileFromClick(e)
        logTile(xTile, yTile)
    }
    function logTile(x, y){
        if (x < 0 || y < 0 || x > map.width - 1 || y > map.height -1) return
    
        var logObj = {
            tile: map.tiles[x][y],
            tile_holding: map.tiles[x][y]?.holding,
            tile_items: map.tiles[x][y]?.items,
            tile_x: x,
            tile_y: y,
        }
        if (logObj.tile?.linkedFrom) logObj._linkedFrom = map.tiles[logObj.tile.linkedFrom[0]][logObj.tile.linkedFrom[1]]
        if (logObj.tile?.linkedTo) logObj._linkedTo = logObj.tile.linkedTo.map(xyAry => map.tiles[xyAry[0]][xyAry[1]])
        console.log(logObj)

    }
    return {
        goTo,
        goToFromClick,
        logTile,
        logTileFromClick,
        highlightFromClick,
        highlightTile
    }
})()

const zoom = (function zoomWrap(){
    addEventListener('wheel', handleWheel)

    var currentZoomLevel = 1,
        zoomLevels = [ 1, 2, 10, 40, 80 ], // removed 5
        currentZoom = zoomLevels[currentZoomLevel]

    function handleWheel(e){
        if (e.target !== canvas) return
        var lastZoom = zoomLevels[currentZoomLevel]
        currentZoomLevel += e.deltaY > 0 ? 1 : -1
        currentZoomLevel = Math.max(Math.min(currentZoomLevel, zoomLevels.length -1), 0)
        currentZoom = zoomLevels[currentZoomLevel]
        if (lastZoom > 2) requestAnimationFrame(animate)
    }
    return { get current(){ return currentZoom } }
})()

const images = (function imageWrap(){
    let imgSpace = {
        tree: new Image(),
        grass: new Image()
    }
    imgSpace.tree.src = './img/Tree.png'
    imgSpace.grass.src = './img/Grass.png'
    return {
        ...imgSpace
    }
})()

const keys = (function keyWrap(){
    addEventListener('keydown', handleKeyDown)
    addEventListener('keyup', handleKeyUp)

    var keyStates = {}
    var boundKeys = ['w','a','s','d','shift','capslock']

    for (var key of boundKeys) {
        keyStates[key] = false
    }

    function handleKeyDown(e){
        if (chat.typing.state) 
            return chat.typing.handleKeys(e)
        else if (e.key == 'Enter')
            chat.typing.changeState(true)

        if (zoom.current > 2) return

        var key = e.key.toLowerCase()
        // console.log(key)
    
        if (!keyStates[key] && boundKeys.includes(key)) 
            keyStates[key] = true

        if (key == 'f') thePlayer.handleKeyF()
        else if (key == 'g') thePlayer.inventory.dropItem()

        else if (key == 'arrowleft') thePlayer.items.cycle('left')
        else if (key == 'arrowright') thePlayer.items.cycle('right')
        else if (key == 'arrowup') thePlayer.inventory.cycle('up')
        else if (key == 'arrowdown') thePlayer.inventory.cycle('down')

        else if (key == 'tab') {
            e.preventDefault()
            thePlayer.inventory.toggleOpenState()
        }
    }
    function handleKeyUp(e){
        var key = e.key.toLowerCase()
        
        if (boundKeys.includes(key)) 
            keyStates[key] = false
    }

    return {
        get states() { return keyStates }
    }
})();

const mouse = (function mouseWrap(){
    addEventListener('click', handleClick)
    addEventListener('mousedown', handleMouseDown)
    addEventListener('mouseup', handleMouseUp)
    addEventListener('mousemove', handleMouseMove)
    addEventListener('contextmenu', e => {
        e.preventDefault()
        handleClick(e)
    })

    var down = false,
        clickID = 0,
        lastClickButton = 0,
        x = 0, 
        y = 0

    function handleClick(e){
        if (chat.typing.state &&
            e.target == canvas) chat.typing.changeState(false)


        if (e.shiftKey) dbg.logTileFromClick(e)
        if (e.ctrlKey) dbg.goToFromClick(e)
    }
    function handleMouseDown(e){
        lastClickButton = e.button
        clickID++
        e.clickID = clickID
        down = true
        if (e.altKey) dbg.highlightFromClick(e)
    }
    function handleMouseUp(){
        down = false
    }
    function handleMouseMove(e){
        x = e.x
        y = e.y
        if (!e.altKey) return

        e.buttonOverride = lastClickButton
        e.clickID = clickID
        if (down) dbg.highlightFromClick(e)
    }

    return {
        get x() { return x },
        get y() { return y },
        get centerAngle() { return angle360(canvas.width / 2, canvas.height / 2, x, y) },
        get centerRadian() { return radian(x, y, canvas.width / 2, canvas.height / 2) }
    }
})()

const vmaxToPx = n => 
    Math.max(
        canvas.width,
        canvas.height
    ) / 100 * n / zoom.current

const vmaxToPxReal = n => 
    Math.max(
        canvas.width,
        canvas.height
    ) / 100 * n

const pxToVmax = n => 
    n / (Math.max(
            canvas.width,
            canvas.height
        )) * 100 * zoom.current

const angle=(a,b,y,z)=>Math.atan2(z-b,y-a)*180/Math.PI
const angle360=(a,b,y,z)=>{let t=angle(a,b,y,z);return t<0?t+360:t}
const radian=(a,b,y,z)=>Math.atan2(a-y, b-z)
const div=(c,a)=>{let x=document.createElement('div');x.classList=c;if(a){a.append(x)}return x}
const create=(w,c,a)=>{let x=document.createElement(w);x.classList=c;if(a){a.append(x)}return x}
const el=q=>document.querySelector(q)

function setCanvasSize(){
    let dpi = window.devicePixelRatio
    canvas.width = window.innerWidth * dpi
    canvas.height = window.innerHeight * dpi
}

function rand(min, max){
    [min, max] = setRandMinMax(min, max)
    return Math.random()*(max-min)+min
}

function randFloor(min, max){
    [min, max] = setRandMinMax(min, max)
    return Math.floor(Math.random()*(max-min)+min)
}

function randBool(){
    return Boolean(randFloor(2))
}

function setRandMinMax(min, max){
    if (min == undefined && 
        max == undefined) [min, max] = [0, 1]
    else if (max == undefined) {
        max = 0
    }
    if (max < min) [min, max] = [max, min]
    return [min, max]
}

var canvas, c,
    theMap, thePlayer

function init(){
    addEventListener('resize', setCanvasSize)
    canvas = document.querySelector('.canvas')
    setCanvasSize()

    c = canvas.getContext('2d')

    chat.init()

    websocket.init()

    theMap = map.new()
    theMap.generate()

    thePlayer = player.new()

    var tile = map.tiles[1][1]
    tile.items.push(item.new({
        itemType: 'water',
        x: 21,
        y: 21,
        tileX: tile.tileX,
        tileY: tile.tileY,
        style: {
            type: 'circle',
            r: .25
        },
    }))
    tile.items.push(item.new({
        itemType: 'water',
        x: 21,
        y: 21,
        tileX: tile.tileX,
        tileY: tile.tileY,
        style: {
            type: 'circle',
            r: .25
        },
    }))

    tile.items.push(item.new({
        itemType: 'blood',
        x: 24,
        y: 21,
        tileX: tile.tileX,
        tileY: tile.tileY,
        style: {
            type: 'circle',
            r: .25
        },
    }))

    requestAnimationFrame(animate)
}

var item = {
    type: 'item',
    extraCollisionDistance: .5,
    infoText: {
        color: 'white',
        fontSize: 1.5
    },
    init(infos){
        this.itemType = infos.itemType

        this.x = infos.x
        this.y = infos.y
        this.tileX = infos.tileX
        this.tileY = infos.tileY

        this.tag = infos.tag

        this.beingThrown = false
        this.dX = this.dY = 0

        this.style = infos.style

        this.inCollisionRange = false

        return this
    },
    drawCircle(){
        c.beginPath()
        c.arc(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(this.style.r),
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = 'cyan'
        c.fill()
        c.closePath()
    },
    drawInfo(){


        // ITEM TYPE TEXT

        c.beginPath()
        c.font = vmaxToPx(this.infoText.fontSize) + 'px Arial'
        c.fillStyle = this.infoText.color
        c.textAlign = 'center'
        c.fillText(this.itemType, 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x) , 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 3.5)
        )
        c.closePath()

        // 'grab' text

        c.beginPath()
        c.font = vmaxToPx(this.infoText.fontSize * .5) + 'px Arial'
        c.fillStyle = this.infoText.color
        c.textAlign = 'left'
        c.fillText('(grab)', 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - .25) , 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 1.75)
        )
        c.closePath()

        // 'F' text

        c.beginPath()
        c.font = vmaxToPx(this.infoText.fontSize * .5) + 'px Arial'
        c.fillStyle = this.infoText.color
        c.textAlign = 'left'
        c.fillText('F', 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 1.5) , 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 2)
        )
        c.closePath()

        // F SQUARE

        c.beginPath()
        c.lineWidth = 1
        c.strokeStyle = 'darkgray'
        c.rect(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 1.75) , 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 2.75),
            vmaxToPx(1.5),
            vmaxToPx(1.5),
        )
        c.stroke()
        c.closePath()

        // IF PLAYER CAN CYCLE THROUGH ITEMS
        if (thePlayer.items.canShowInfo.length > 1) {

            c.beginPath()
            // count text
            c.font = vmaxToPx(this.infoText.fontSize * .65) + 'px Arial'
            c.fillStyle = this.infoText.color
            c.textAlign = 'center'
            c.fillText((
                (thePlayer.items.showingIndex + 1) + '/' + thePlayer.items.canShowInfo.length
            ), 
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 7)
            )
            c.closePath()

            c.beginPath()
            // '(more)' text
            c.font = vmaxToPx(this.infoText.fontSize * .5) + 'px Arial'
            c.fillStyle = this.infoText.color
            c.textAlign = 'center'
            c.fillText('(more)', 
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6)
            )
            c.closePath()


            // <- SQUARE
    
            c.beginPath()
            c.strokeStyle = 'darkgray'
            c.rect(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 3) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 7),
                vmaxToPx(1.5),
                vmaxToPx(1.5),
            )
            c.stroke()
            c.closePath()

            // -> SQUARE
    
            c.beginPath()
            c.strokeStyle = 'darkgray'
            c.rect(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 1.5) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 7),
                vmaxToPx(1.5),
                vmaxToPx(1.5),
            )
            c.stroke()
            c.closePath()


            // RIGHT -> ARROW
            c.beginPath()
            c.lineWidth = 1.5
            c.strokeStyle = 'white'
            c.moveTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 2.25) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            )
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 2.75) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            ) 
            c.moveTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 2.5) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.25),
            )
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 2.75) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            ) 
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 2.5) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.75),
            ) 


                // LEFT <- ARROW
            
            c.moveTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 2.25) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            )
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 2.75) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            ) 
            c.moveTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 2.5) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.25),
            )
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 2.75) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.5),
            ) 
            c.lineTo(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x + 2.5) , 
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y + 6.75),
            ) 
            
            




            c.stroke()
            c.closePath()


        }


        c.closePath()
    },
    drawAfterPlayer(){
        this.drawInfo()
    },
    draw(dt){
        if (this.beingThrown) this.updateThrowPosition(dt)
        if (this.style.type == 'circle') this.drawCircle()
        if (this.inCollisionRange &&
            thePlayer.items.isShowingInfo == this) theMap.drawAfterPlayerArray.push(this)
    },
    new(infos){
        return Object.create(this).init(infos)
    },
    checkCollision(){
        if (this.style.type == 'circle') this.checkCircleCollision()
    },
    checkCircleCollision(){

        let {x: pX, y: pY, r: pR} = thePlayer

        difX = this.x - pX
        difY = this.y - pY
        difR = this.style.r + pR

        if (difR + this.extraCollisionDistance > Math.hypot(difX, difY)) {
            // collision detected
            if (!this.inCollisionRange) {
                this.inCollisionRange = true
                thePlayer.items.addToCanShow(this)
            }
        }
        else if (this.inCollisionRange) {
            this.inCollisionRange = false
            thePlayer.items.removeFromCanShow(this)
        }
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
        this.x = 
        this.y = 
        this.tileX = 
        this.tileY = -1

        thePlayer.items.holding.push(this)
        thePlayer.inventory.updateList()

        this.inCollisionRange = false
    },
    pickItemUp(){ // still need to implement
        this.removeFromTile()
        this.putInPlayerItems()
    },
    throw(){
        this.beingThrown = true
        
        var radians = mouse.centerRadian
        this.dX = Math.sin(radians)*2
        this.dY = Math.cos(radians)*2
    },
    updateThrowPosition(dt){
        this.x += this.dX / dt
        this.y += this.dY / dt

        let tileCheckX = Math.floor(this.x / map.tileSize),
            tileCheckY = Math.floor(this.y / map.tileSize)

        if (tileCheckX !== this.tileX ||
            tileCheckY !== this.tileY) {
                console.log('change tile')
                this.removeFromTile()
                this.tileX = tileCheckX
                this.tileY = tileCheckY

                let newTile = map.tiles[tileCheckX][tileCheckY]
                if (newTile.isUnderHouseOrLinkedHouse()){
                    newTile.getHouseOrLinkedHouse().items.push(this)
                }
                else newTile.items.push(this)
            }

        this.dX *= .98
        this.dY *= .98
        if (Math.hypot(this.dX, this.dY) <= .5) this.beingThrown = false
    }
}

var tree = {
    type: 'tree',
    zoomedOutColor: '#252',
    init(infos){
        this.x = infos.x * map.tileSize
        this.y = infos.y * map.tileSize

        return this
    },
    drawImage(){
        c.save()
        c.globalAlpha = .5
        c.beginPath()
        c.drawImage(
            images.tree, 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(map.tileSize),
            vmaxToPx(map.tileSize)
        )
        c.closePath()
        c.restore()
    },
    drawCircle(){
        c.beginPath()
        c.arc(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - (map.tileSize / 2)), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - (map.tileSize / 2)),
            vmaxToPx(6),
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.zoomedOutColor
        c.fill()
        c.closePath()
    },
    actualDraw(){
        // when zoomed out past visible detail, 
        // draw a circle instead of the tree image
        if (zoom.current > 10) this.drawCircle()
        else this.drawImage()
    },
    drawAfterPlayer(){
        this.actualDraw()
    },
    draw(){
        // draw tree over player, unless zoomed out
        if (zoom.current > 5) this.actualDraw()
        else theMap.drawAfterPlayerArray.push(this)
    },
    new(infos){
        return Object.create(this).init(infos)
    },

}

var roof = {
    color: '#500',
    type: 'roof',
    init(infos){
        this.parent = infos.parent
        this.color = infos.color || this.color
        this.sections = []
        infos.sections.forEach((info, i) => {
            this.sections.push({
                x: info[0],
                y: info[1],
                width: info[2],
                height: info[3]
            })
        })
        return this
    },
    draw(){
        if (map.getTileHolding(this.parent).under) return
        c.beginPath()
        for (var i = 0, length = this.sections.length; i < length; i++){
            c.rect(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.sections[i].x),
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.sections[i].y),
                vmaxToPx(this.sections[i].width), 
                vmaxToPx(this.sections[i].height)
            )
        }
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    },
    new(infos){
        return Object.create(this).init(infos)
    },
}

var floor = {
    color: '#500',
    type: 'floor',
    init(infos){
        this.parent = infos.parent
        this.color = infos.color || this.color
        this.sections = []
        infos.sections.forEach((info, i) => {
            this.sections.push({
                x: info[0],
                y: info[1],
                width: info[2],
                height: info[3]
            })
        })
        return this
    },
    draw(){
        if (!map.getTileHolding(this.parent).under) return
        c.beginPath()
        for (var i = 0, length = this.sections.length; i < length; i++){
            c.rect(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.sections[i].x),
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.sections[i].y),
                vmaxToPx(this.sections[i].width), 
                vmaxToPx(this.sections[i].height)
            )
        }
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    },
    new(infos){
        return Object.create(this).init(infos)
    },
}

var box = {
    color: '#999',
    type: 'box',
    init(x, y, w, h, color){
        this.x = x
        this.y = y
        this.width = w
        this.height = h
        if (color) this.color = color

        // map.boxes.push(this)
        return this
    },
    draw(){
        c.beginPath()
        c.rect(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(this.width), 
            vmaxToPx(this.height)
        )
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    },
    new(x, y, w, h, c){
        return Object.create(this).init(x, y, w, h, c)
    },
}

var mainCollision = {
    color: 'lime',
    time: 'mainCollision',
    init(x, y, w, h){
        this.x = x
        this.y = y
        this.width = w
        this.height = h

        return this
    },
    draw(){
        c.beginPath()
        c.rect(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(this.width), 
            vmaxToPx(this.height)
        )
        c.strokeStyle = this.color
        c.lineWidth = 3
        c.stroke()
        c.closePath()
    },
    new(x, y, w, h){
        return Object.create(this).init(x, y, w, h)
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
        var pickedColor = 
            this.colors[Math.floor(
                Math.random() * this.colors.length
            )]
        // var pickedColor = this.colors[0]

        this.tileX = tileX
        this.tileY = tileY

        var fresh = makeHouse[houseType]( { 
            x, 
            y, 
            wallColor: pickedColor[0], 
            roofColor: pickedColor[1],
            floorColor: pickedColor[2],
            parent: [x / 20, y / 20]
        } )

        this.under = false
        this.floors = fresh.floors
        this.boxes = fresh.boxes
        this.roofs = fresh.roofs
        this.mainCollision = fresh.mainCollision

        this.currentItemZone = ''
        this.itemZones = fresh.itemZones 
        // if (!this.itemZones) this.itemZones = []

        this.spawnPoints = fresh.spawnPoints
        if (!this.spawnPoints) this.spawnPoints = []

        this.items = []

        return this
    },
    draw(dt){
        if (dt) {
            if (this.lastDrawnDT == dt) return
            else this.lastDrawnDT = dt
        }


        // FLOORS / ITEMS
        if (this.under) {
            for (var i = 0, length = this.floors.length; i < length; i++){
                this.floors[i].draw()
            }
            
            // if items tag matches 
            // current collision item zone
            // push it to draw after tiles
            for (let i = 0, length = this.items.length; i < length; i++) {
                if (this.currentItemZone == this.items[i].tag || !this.items[i].tag)
                    theMap.drawItemsAfterTilesArray.push(this.items[i])
            }
        }
        // WALLS / BOXES
        if (zoom.current <= 5) {
            for (var i = 0, length = this.boxes.length; i < length; i++){
                this.boxes[i].draw()
            }
        }
        // ROOFS
        if (OPTIONS.DEV.DEBUG.SHOW_HOUSE_ROOFS) {
            for (var i = 0, length = this.roofs.length; i < length; i++){
                this.roofs[i].draw()
            }
        }
        // MAIN COLLISION CHECK
        if (OPTIONS.DEV.DEBUG.SHOW_MAIN_COLLISION) {
            this.mainCollision.draw()
        }

        if (OPTIONS.DEV.DEBUG.SHOW_HOUSE_ITEM_ZONES) {
            for (var i = 0, length = this.itemZones.length; i < length; i++){
                this.itemZones[i].draw()
            }
        }

        if (OPTIONS.DEV.DEBUG.SHOW_HOUSE_ITEM_SPAWN_POINTS) {
            for (var i = 0, length = this.spawnPoints.length; i < length; i++){
                this.spawnPoints[i].draw()
            }
        }
    },
    new(houseObj){
        return Object.create(this).init(houseObj)
    },
    checkItemsCollision(){
        if (this.items.length) {
            for (let i = 0, length = this.items.length; i < length; i++) {
                this.items[i].checkCollision()
            }
        }
    },
}

var itemZone = {
    type: 'itemZone',
    color: 'rgba(0, 200, 255, .15)',
    strokeColor: 'rgba(0, 255, 0, .5)',
    init(...infos){
        this.x = infos[0]
        this.y = infos[1]
        this.width = infos[2]
        this.height = infos[3]

        this.tag = infos[4]

        return this
    },
    draw(){
        c.beginPath()
        c.strokeStyle = this.strokeColor
        c.lineWidth = 2
            c.rect(
                canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
                canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
                vmaxToPx(this.width), 
                vmaxToPx(this.height)
            )
            c.stroke()
            c.fillStyle = this.color
            c.fill()

            
        // ITEM TYPE TEXT

        c.font = vmaxToPx(1) + 'px Arial'
        c.fillStyle = 'gray'
        c.textAlign = 'left'
        c.fillText(this.tag, 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - .25), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - 1)
        )
        c.closePath()
    },
    new(...infos){
        return Object.create(this).init(...infos)
    },
}

var spawnPoint = {
    type: 'spawnPoint',
    color: 'rgba(0, 100, 255, .5)',
    r: 1,
    init(...infos){
        this.x = infos[0]
        this.y = infos[1]

        this.tag = infos[2]

        return this
    },
    draw(){
        c.beginPath()
        c.arc(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(this.r),
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = this.color
        c.fill()

        // ITEM TYPE TEXT
        c.save()
        c.font = vmaxToPx(1) + 'px Arial'
        c.fillStyle = 'black'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText(this.tag, 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x ), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y)
        )
        c.closePath()
        c.restore()
    },
    new(...infos){
        return Object.create(this).init(...infos)
    },
}

var makeHouse = {
    // HOUSE 3
    house3D1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [
                // other door
                box.new(45 + x, 0 + y, 10, 1, wallColor),
                box.new(0 + x, 0 + y, 42, 1, wallColor),
                // door
                box.new(0 + x, 15 + y, 5, 1, wallColor),
                box.new(8 + x, 15 + y, 47, 1, wallColor),
                // sides
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(54 + x, 0 + y, 1, 16, wallColor),

                // way
                box.new(18 + x, 11 + y, 10, 1, wallColor),
                box.new(12 + x, 11 + y, 3, 1, wallColor),
                box.new(31 + x, 11 + y, 8, 1, wallColor),

                // other way
                box.new(38 + x, 0 + y, 1, 7, wallColor),
                box.new(38 + x, 10 + y, 1, 2, wallColor),
                box.new(34 + x, 0 + y, 1, 12, wallColor),
                box.new(20 + x, 0 + y, 1, 12, wallColor),
                box.new(12 + x, 0 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 54, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 54, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 55, 16),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 11, 14, 'a'),
                itemZone.new(12 + x, 12 + y, 27, 3, 'b'),
                itemZone.new(13 + x, 1 + y, 7, 11, 'c'),
                itemZone.new(21 + x, 1 + y, 13, 11, 'd'),
                itemZone.new(35 + x, 1 + y, 4, 11, 'e'),
                itemZone.new(39 + x, 1 + y, 15, 14, 'f'),
            ],
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
    house3U1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 1.5
        return {
            boxes: [
                // other door
                box.new(45 + x, 0 + y, 10, 1, wallColor),
                box.new(0 + x, 0 + y, 42, 1, wallColor),
                // door
                box.new(0 + x, 15 + y, 5, 1, wallColor),
                box.new(8 + x, 15 + y, 47, 1, wallColor),
                // sides
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(54 + x, 0 + y, 1, 16, wallColor),

                // way
                box.new(18 + x, 4 + y, 10, 1, wallColor),
                box.new(12 + x, 4 + y, 3, 1, wallColor),
                box.new(31 + x, 4 + y, 8, 1, wallColor),

                // other way
                box.new(38 + x, 4 + y, 1, 7, wallColor),
                box.new(38 + x, 14 + y, 1, 2, wallColor),
                box.new(34 + x, 4 + y, 1, 12, wallColor),
                box.new(20 + x, 4 + y, 1, 12, wallColor),
                box.new(12 + x, 4 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 54, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 54, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 55, 16),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 11, 14, 'a'),
                itemZone.new(12 + x, 1 + y, 27, 3, 'b'),
                itemZone.new(13 + x, 4 + y, 7, 11, 'c'),
                itemZone.new(21 + x, 4 + y, 13, 11, 'd'),
                itemZone.new(35 + x, 4 + y, 4, 11, 'e'),
                itemZone.new(39 + x, 1 + y, 15, 14, 'f'),
            ],
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
    house3R1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [
                // other door
                box.new(0 + x, 45 + y, 1, 10, wallColor),
                box.new(0 + x, 0 + y, 1, 42, wallColor),
                // door
                box.new(15 + x, 0 + y, 1, 5, wallColor),
                box.new(15 + x, 8 + y, 1, 47, wallColor),
                // sides
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 54 + y, 16, 1, wallColor),

                // way
                box.new(4 + x, 18 + y, 1, 10, wallColor),
                box.new(4 + x, 12 + y, 1, 3, wallColor),
                box.new(4 + x, 31 + y, 1, 8, wallColor),

                // other way
                box.new(4 + x, 38 + y, 7, 1, wallColor),
                box.new(14 + x, 38 + y, 2, 1, wallColor),
                box.new(4 + x, 34 + y, 12, 1, wallColor),
                box.new(4 + x, 20 + y, 12, 1, wallColor),
                box.new(4 + x, 12 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 54]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 54]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 55),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 14, 11, 'a'),
                itemZone.new(1 + x, 12 + y, 3, 27, 'b'),
                itemZone.new(4 + x, 13 + y, 11, 7, 'c'),
                itemZone.new(4 + x, 21 + y, 11, 13, 'd'),
                itemZone.new(4 + x, 35 + y, 11, 4, 'e'),
                itemZone.new(1 + x, 39 + y, 14, 15, 'f'),
            ],
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
    house3L1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2.5
        return {
            boxes: [
                // other door
                box.new(0 + x, 45 + y, 1, 10, wallColor),
                box.new(0 + x, 0 + y, 1, 42, wallColor),
                // door
                box.new(15 + x, 0 + y, 1, 5, wallColor),
                box.new(15 + x, 8 + y, 1, 47, wallColor),
                // sides
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 54 + y, 16, 1, wallColor),

                // way
                box.new(11 + x, 18 + y, 1, 10, wallColor),
                box.new(11 + x, 12 + y, 1, 3, wallColor),
                box.new(11 + x, 31 + y, 1, 8, wallColor),

                // other way
                box.new(0 + x, 38 + y, 7, 1, wallColor),
                box.new(10 + x, 38 + y, 2, 1, wallColor),
                box.new(0 + x, 34 + y, 12, 1, wallColor),
                box.new(0 + x, 20 + y, 12, 1, wallColor),
                box.new(0 + x, 12 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 54]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 54]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 55),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 14, 11, 'a'),
                itemZone.new(12 + x, 12 + y, 3, 27, 'b'),
                itemZone.new(1 + x, 13 + y, 11, 7, 'c'),
                itemZone.new(1 + x, 21 + y, 11, 13, 'd'),
                itemZone.new(1 + x, 35 + y, 11, 4, 'e'),
                itemZone.new(1 + x, 39 + y, 14, 15, 'f'),
            ],
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
    house2D1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [
                box.new(0 + x, 0 + y, 35, 1, wallColor),
                box.new(0 + x, 15 + y, 5, 1, wallColor),
                box.new(0 + x, 6 + y, 10, 1, wallColor),
                box.new(8 + x, 15 + y, 27, 1, wallColor),
                box.new(19 + x, 4 + y, 6, 1, wallColor),
                box.new(13 + x, 4 + y, 3, 1, wallColor),
                box.new(28 + x, 4 + y, 7, 1, wallColor),

                box.new(9 + x, 4 + y, 1, 3, wallColor),
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(34 + x, 0 + y, 1, 16, wallColor),
                box.new(22 + x, 4 + y, 1, 12, wallColor),
                box.new(13 + x, 4 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 35, 16),
            itemZones: [
                itemZone.new(1 + x, 7 + y, 12, 8, 'a'),
                itemZone.new(10 + x, 4 + y, 3, 3, 'a'),
                itemZone.new(1 + x, 1 + y, 8, 5, 'b'),
                itemZone.new(9 + x, 1 + y, 19, 3, 'c'),
                itemZone.new(28 + x, 1 + y, 6, 3, 'd'),
                itemZone.new(14 + x, 4 + y, 8, 11, 'e'),
                itemZone.new(23 + x, 4 + y, 11, 11, 'f'),
            ],
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
    house2D2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [
                box.new(0 + x, 0 + y, 35, 1, wallColor),
                box.new(30 + x, 15 + y, 5, 1, wallColor),
                box.new(25 + x, 6 + y, 10, 1, wallColor),
                box.new(0 + x, 15 + y, 27, 1, wallColor),
                box.new(10 + x, 4 + y, 6, 1, wallColor),
                box.new(19 + x, 4 + y, 3, 1, wallColor),
                box.new(0 + x, 4 + y, 7, 1, wallColor),

                box.new(25 + x, 4 + y, 1, 3, wallColor),
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(34 + x, 0 + y, 1, 16, wallColor),
                box.new(21 + x, 4 + y, 1, 12, wallColor),
                box.new(12 + x, 4 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 35, 16),
            itemZones: [
                itemZone.new(22 + x, 7 + y, 12, 8, 'a'),
                itemZone.new(22 + x, 4 + y, 3, 3, 'a'),
                itemZone.new(26 + x, 1 + y, 8, 5, 'b'),
                itemZone.new(7 + x, 1 + y, 19, 3, 'c'),
                itemZone.new(1 + x, 1 + y, 6, 3, 'd'),
                itemZone.new(13 + x, 4 + y, 8, 11, 'e'),
                itemZone.new(1 + x, 4 + y, 11, 11, 'f'),
            ],
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
    house2U1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 1.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(34 + x, 0 + y, 1, 16, wallColor),
                box.new(0 + x, 15 + y, 35, 1, wallColor),
                // border door
                box.new(30 + x, 0 + y, 5, 1, wallColor),
                box.new(0 + x, 0 + y, 27, 1, wallColor),
                // one way
                box.new(25 + x, 9 + y, 10, 1, wallColor),
                box.new(10 + x, 11 + y, 6, 1, wallColor),
                box.new(19 + x, 11 + y, 3, 1, wallColor),
                box.new(0 + x, 11 + y, 7, 1, wallColor),
                // other way
                box.new(25 + x, 9 + y, 1, 3, wallColor),
                box.new(21 + x, 0 + y, 1, 12, wallColor),
                box.new(12 + x, 0 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 35, 16),
            itemZones: [
                itemZone.new(22 + x, 1 + y, 12, 8, 'a'),
                itemZone.new(22 + x, 9 + y, 3, 3, 'a'),
                itemZone.new(26 + x, 10 + y, 8, 5, 'b'),
                itemZone.new(7 + x, 12 + y, 19, 3, 'c'),
                itemZone.new(1 + x, 12 + y, 6, 3, 'd'),
                itemZone.new(13 + x, 1 + y, 8, 11, 'e'),
                itemZone.new(1 + x, 1 + y, 11, 11, 'f'),
            ],
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
    house2U2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 1.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 1, 16, wallColor),
                box.new(34 + x, 0 + y, 1, 16, wallColor),
                // border long
                box.new(0 + x, 15 + y, 35, 1, wallColor),
                // border door
                box.new(0 + x, 0 + y, 5, 1, wallColor),
                box.new(8 + x, 0 + y, 27, 1, wallColor),
                // one way
                box.new(0 + x, 9 + y, 10, 1, wallColor),
                box.new(28 + x, 11 + y, 7, 1, wallColor),
                box.new(13 + x, 11 + y, 3, 1, wallColor),
                box.new(19 + x, 11 + y, 6, 1, wallColor),
                // other way
                box.new(9 + x, 9 + y, 1, 3, wallColor),
                box.new(22 + x, 0 + y, 1, 12, wallColor),
                box.new(13 + x, 0 + y, 1, 12, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 34, 15]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 35, 16),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 12, 8, 'a'),
                itemZone.new(10 + x, 9 + y, 3, 3, 'a'),
                itemZone.new(1 + x, 10 + y, 8, 5, 'b'),
                itemZone.new(9 + x, 12 + y, 19, 3, 'c'),
                itemZone.new(28 + x, 12 + y, 6, 3, 'd'),
                itemZone.new(14 + x, 1 + y, 8, 11, 'e'),
                itemZone.new(23 + x, 1 + y, 11, 11, 'f'),
            ],
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
    house2L1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 34 + y, 16, 1, wallColor),
                // border long
                box.new(15 + x, 0 + y, 1, 35, wallColor),
                // border door
                box.new(0 + x, 0 + y, 1, 5, wallColor),
                box.new(0 + x, 8 + y, 1, 27, wallColor),
                // one way
                box.new(9 + x, 0 + y, 1, 10, wallColor),
                box.new(11 + x, 28 + y, 1, 7, wallColor),
                box.new(11 + x, 13 + y, 1, 3, wallColor),
                box.new(11 + x, 19 + y, 1, 6, wallColor),
                // other way
                box.new(9 + x, 9 + y, 3, 1, wallColor),
                box.new(0 + x, 22 + y, 12, 1, wallColor),
                box.new(0 + x, 13 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 35),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 8, 12, 'a'),
                itemZone.new(9 + x, 10 + y, 3, 3, 'a'),
                itemZone.new(10 + x, 1 + y, 5, 8, 'b'),
                itemZone.new(12 + x, 9 + y, 3, 19, 'c'),
                itemZone.new(12 + x, 28 + y, 3, 6, 'd'),
                itemZone.new(1 + x, 14 + y, 11, 8, 'e'),
                itemZone.new(1 + x, 23 + y, 11, 11, 'f'),
            ],
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
    house2L2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 34 + y, 16, 1, wallColor),
                // border long
                box.new(15 + x, 0 + y, 1, 35, wallColor),
                // border door
                box.new(0 + x, 30 + y, 1, 5, wallColor),
                box.new(0 + x, 0 + y, 1, 27, wallColor),
                // one way
                box.new(9 + x, 25 + y, 1, 10, wallColor),
                box.new(11 + x, 0 + y, 1, 7, wallColor),
                box.new(11 + x, 19 + y, 1, 3, wallColor),
                box.new(11 + x, 10 + y, 1, 6, wallColor),
                // other way
                box.new(9 + x, 25 + y, 3, 1, wallColor),
                box.new(0 + x, 21 + y, 12, 1, wallColor),
                box.new(0 + x, 12 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 35),
            itemZones: [
                itemZone.new(1 + x, 22 + y, 8, 12, 'a'),
                itemZone.new(9 + x, 22 + y, 3, 3, 'a'),
                itemZone.new(10 + x, 26 + y, 5, 8, 'b'),
                itemZone.new(12 + x, 7 + y, 3, 19, 'c'),
                itemZone.new(12 + x, 1 + y, 3, 6, 'd'),
                itemZone.new(1 + x, 13 + y, 11, 8, 'e'),
                itemZone.new(1 + x, 1 + y, 11, 11, 'f'),
            ],
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
    house2R1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 34 + y, 16, 1, wallColor),
                // border long
                box.new(0 + x, 0 + y, 1, 35, wallColor),
                // border door
                box.new(15 + x, 30 + y, 1, 5, wallColor),
                box.new(15 + x, 0 + y, 1, 27, wallColor),
                // one way
                box.new(6 + x, 25 + y, 1, 10, wallColor),
                box.new(4 + x, 0 + y, 1, 7, wallColor),
                box.new(4 + x, 19 + y, 1, 3, wallColor),
                box.new(4 + x, 10 + y, 1, 6, wallColor),
                // other way
                box.new(4 + x, 25 + y, 3, 1, wallColor),
                box.new(4 + x, 21 + y, 12, 1, wallColor),
                box.new(4 + x, 12 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 35),
            itemZones: [
                itemZone.new(7 + x, 22 + y, 8, 12, 'a'),
                itemZone.new(4 + x, 22 + y, 3, 3, 'a'),
                itemZone.new(1 + x, 26 + y, 5, 8, 'b'),
                itemZone.new(1 + x, 7 + y, 3, 19, 'c'),
                itemZone.new(1 + x, 1 + y, 3, 6, 'd'),
                itemZone.new(4 + x, 13 + y, 11, 8, 'e'),
                itemZone.new(4 + x, 1 + y, 11, 11, 'f'),
            ],
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
    house2R2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2.5, y = y + 2.5
        return {
            boxes: [

                // border
                box.new(0 + x, 0 + y, 16, 1, wallColor),
                box.new(0 + x, 34 + y, 16, 1, wallColor),
                // border long
                box.new(0 + x, 0 + y, 1, 35, wallColor),
                // border door
                box.new(15 + x, 0 + y, 1, 5, wallColor),
                box.new(15 + x, 8 + y, 1, 27, wallColor),
                // one way
                box.new(6 + x, 0 + y, 1, 10, wallColor),
                box.new(4 + x, 28 + y, 1, 7, wallColor),
                box.new(4 + x, 13 + y, 1, 3, wallColor),
                box.new(4 + x, 19 + y, 1, 6, wallColor),
                // other way
                box.new(4 + x, 9 + y, 3, 1, wallColor),
                box.new(4 + x, 22 + y, 12, 1, wallColor),
                box.new(4 + x, 13 + y, 12, 1, wallColor),
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 15, 34]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 35),
            itemZones: [
                itemZone.new(7 + x, 1 + y, 8, 12, 'a'),
                itemZone.new(4 + x, 10 + y, 3, 3, 'a'),
                itemZone.new(1 + x, 1 + y, 5, 8, 'b'),
                itemZone.new(1 + x, 9 + y, 3, 19, 'c'),
                itemZone.new(1 + x, 28 + y, 3, 6, 'd'),
                itemZone.new(4 + x, 14 + y, 11, 8, 'e'),
                itemZone.new(4 + x, 23 + y, 11, 11, 'f'),
            ],
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
    house1L1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2
        return {
            boxes: [
                box.new(0 + x, 5 + y, 6, 1, wallColor),
                box.new(0 + x, 0 + y, 17, 1, wallColor),
                box.new(0 + x, 15 + y, 10, 1, wallColor),
                box.new(9 + x, 10 + y, 8, 1, wallColor),
                box.new(9 + x, 4 + y, 1, 12, wallColor),
                box.new(16 + x, 0 + y, 1, 11, wallColor),
                box.new(0 + x, 12 + y, 1, 4, wallColor),
                box.new(0 + x, 0 + y, 1, 9, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 9, 15],
                        [9.5 + x, 0.5 + y, 7, 10]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 9, 15],
                        [9.5 + x, 0.5 + y, 7, 10]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 17, 16),
            itemZones: [
                itemZone.new(1 + x, 6 + y, 8, 9, 'a'),
                itemZone.new(1 + x, 1 + y, 9, 5, 'b'),
                itemZone.new(10 + x, 1 + y, 6, 9, 'c')
            ],
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
    house1L2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2
        return {
            boxes: [
                box.new(0 + x, 10 + y, 6, 1, wallColor),
                box.new(0 + x, 15 + y, 17, 1, wallColor),
                box.new(0 + x, 0 + y, 10, 1, wallColor),
                box.new(9 + x, 5 + y, 8, 1, wallColor),
                box.new(9 + x, 0 + y, 1, 12, wallColor),
                box.new(16 + x, 5 + y, 1, 11, wallColor),
                box.new(0 + x, 0 + y, 1, 4, wallColor),
                box.new(0 + x, 7 + y, 1, 9, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, .5 + y, 9, 15],
                        [9.5 + x, 5.5 + y, 7, 10]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, .5 + y, 9, 15],
                        [9.5 + x, 5.5 + y, 7, 10]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 17, 16),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 8, 9, 'a'),
                itemZone.new(1 + x, 10 + y, 9, 5, 'b'),
                itemZone.new(10 + x, 6 + y, 6, 9, 'c')
            ],
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
    house1R1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2
        return {
            boxes: [
                box.new(11 + x, 10 + y, 6, 1, wallColor),
                box.new(0 + x, 15 + y, 17, 1, wallColor),
                box.new(7 + x, 0 + y, 10, 1, wallColor),
                box.new(0 + x, 5 + y, 8, 1, wallColor),
                box.new(7 + x, 0 + y, 1, 12, wallColor),
                box.new(0 + x, 5 + y, 1, 11, wallColor),
                box.new(16 + x, 0 + y, 1, 4, wallColor),
                box.new(16 + x, 7 + y, 1, 9, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [7.5 + x, .5 + y, 9, 15],
                        [0.5 + x, 5.5 + y, 7, 10]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [7.5 + x, .5 + y, 9, 15],
                        [0.5 + x, 5.5 + y, 7, 10]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 17, 16),
            itemZones: [
                itemZone.new(8 + x, 1 + y, 8, 9, 'a'),
                itemZone.new(7 + x, 10 + y, 9, 5, 'b'),
                itemZone.new(1 + x, 6 + y, 6, 9, 'c')
            ],
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
    house1R2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 1.5, y = y + 2
        return {
            boxes: [
                box.new(11 + x, 5 + y, 6, 1, wallColor),
                box.new(0 + x, 0 + y, 17, 1, wallColor),
                box.new(7 + x, 15 + y, 10, 1, wallColor),
                box.new(0 + x, 10 + y, 8, 1, wallColor),
                box.new(7 + x, 4 + y, 1, 12, wallColor),
                box.new(0 + x, 0 + y, 1, 11, wallColor),
                box.new(16 + x, 12 + y, 1, 4, wallColor),
                box.new(16 + x, 0 + y, 1, 9, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [7.5 + x, .5 + y, 9, 15],
                        [0.5 + x, .5 + y, 7, 10]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [7.5 + x, .5 + y, 9, 15],
                        [0.5 + x, .5 + y, 7, 10]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 17, 16),
            itemZones: [
                itemZone.new(8 + x, 6 + y, 8, 9, 'a'),
                itemZone.new(7 + x, 1 + y, 9, 5, 'b'),
                itemZone.new(1 + x, 1 + y, 6, 9, 'c')
            ],
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
    house1D1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2, y = y + 1.5
        return {
            boxes: [
                box.new(5 + x, 11 + y, 1, 6, wallColor),
                box.new(0 + x, 0 + y, 1, 17, wallColor),
                box.new(15 + x, 7 + y, 1, 10, wallColor),
                box.new(10 + x, 0 + y, 1, 8, wallColor),
                box.new(4 + x, 7 + y, 12, 1, wallColor),
                box.new(0 + x, 0 + y, 10, 1, wallColor),
                box.new(12 + x, 16 + y, 4, 1, wallColor),
                box.new(0 + x, 16 + y, 9, 1, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, 7.5 + y, 15, 9],
                        [0.5 + x, 0.5 + y, 10, 7]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, 7.5 + y, 15, 9],
                        [0.5 + x, 0.5 + y, 10, 7]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 17),
            itemZones: [
                itemZone.new(6 + x, 8 + y, 9, 8, 'a'),
                itemZone.new(1 + x, 7 + y, 5, 9, 'b'),
                itemZone.new(1 + x, 1 + y, 9, 6, 'c')
            ],
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
    house1D2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2, y = y + 1.5
        return {
            boxes: [
                box.new(10 + x, 11 + y, 1, 6, wallColor),
                box.new(15 + x, 0 + y, 1, 17, wallColor),
                box.new(0 + x, 7 + y, 1, 10, wallColor),
                box.new(5 + x, 0 + y, 1, 8, wallColor),
                box.new(0 + x, 7 + y, 12, 1, wallColor),
                box.new(5 + x, 0 + y, 10, 1, wallColor),
                box.new(0 + x, 16 + y, 4, 1, wallColor),
                box.new(7 + x, 16 + y, 9, 1, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, 7.5 + y, 15, 9],
                        [5.5 + x, 0.5 + y, 10, 7]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, 7.5 + y, 15, 9],
                        [5.5 + x, 0.5 + y, 10, 7]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 17),
            itemZones: [
                itemZone.new(1 + x, 8 + y, 9, 8, 'a'),
                itemZone.new(10 + x, 7 + y, 5, 9, 'b'),
                itemZone.new(6 + x, 1 + y, 9, 6, 'c')
            ],
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
    house1U1( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2, y = y + 1.5
        return {
            boxes: [
                box.new(10 + x, 0 + y, 1, 6, wallColor),
                box.new(15 + x, 0 + y, 1, 17, wallColor),
                box.new(0 + x, 0 + y, 1, 10, wallColor),
                box.new(5 + x, 9 + y, 1, 8, wallColor),
                box.new(0 + x, 9 + y, 12, 1, wallColor),
                box.new(5 + x, 16 + y, 11, 1, wallColor),
                box.new(0 + x, 0 + y, 4, 1, wallColor),
                box.new(7 + x, 0 + y, 9, 1, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, 0.5 + y, 15, 9],
                        [5.5 + x, 9.5 + y, 10, 7]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, 0.5 + y, 15, 9],
                        [5.5 + x, 9.5 + y, 10, 7]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 17),
            itemZones: [
                itemZone.new(1 + x, 1 + y, 9, 8, 'a'),
                itemZone.new(10 + x, 1 + y, 5, 9, 'b'),
                itemZone.new(6 + x, 10 + y, 9, 6, 'c')
            ],
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
    house1U2( { x, y, wallColor, roofColor, floorColor, parent } ){
        var x = x + 2, y = y + 1.5
        return {
            boxes: [
                box.new(5 + x, 0 + y, 1, 6, wallColor),
                box.new(0 + x, 0 + y, 1, 17, wallColor),
                box.new(15 + x, 0 + y, 1, 10, wallColor),
                box.new(10 + x, 9 + y, 1, 8, wallColor),
                box.new(4 + x, 9 + y, 12, 1, wallColor),
                box.new(0 + x, 16 + y, 11, 1, wallColor),
                box.new(12 + x, 0 + y, 4, 1, wallColor),
                box.new(0 + x, 0 + y, 9, 1, wallColor)
            ],
            roofs: [
                roof.new({
                    parent: parent,
                    color: roofColor,
                    sections: [
                        [0.5 + x, 0.5 + y, 15, 9],
                        [0.5 + x, 9.5 + y, 10, 7]
                    ]
                })
            ],
            floors: [
                floor.new({
                    parent: parent,
                    color: floorColor,
                    sections: [
                        [0.5 + x, 0.5 + y, 15, 9],
                        [0.5 + x, 9.5 + y, 10, 7]
                    ]
                })
            ],
            mainCollision: mainCollision.new(x, y, 16, 17),
            itemZones: [
                itemZone.new(6 + x, 1 + y, 9, 8, 'a'),
                itemZone.new(1 + x, 1 + y, 5, 9, 'b'),
                itemZone.new(1 + x, 10 + y, 9, 6, 'c')
            ],
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

var road = {
    type: 'road',
    color: OPTIONS.COLORS.road,
    init(info){
        this.x = info.x
        this.y = info.y
        this.connectingRoad = info.connectingRoad
        this.corner = info.corner

        if (info.forceConnectingRoad) this.connectingRoad = true

        return this
    },
    draw(){
        c.beginPath()
        if (this.corner) {
            let xAdjust =
                yAdjust =
                startAngle =
                endAngle = 0

            switch (this.corner) {
                case 'top right':
                    yAdjust = map.tileSize
                    startAngle = Math.PI * 1.5
                    break

                case 'top left':
                    yAdjust = xAdjust = map.tileSize
                    startAngle = Math.PI * 1
                    endAngle = Math.PI * 1.5
                    break
                    
                case 'bottom left':
                    xAdjust = map.tileSize
                    startAngle = Math.PI * .5
                    endAngle = Math.PI * 1
                    break

                case 'bottom right':
                    endAngle = Math.PI * .5
                    break
            }
            
            c.moveTo(
                Math.floor(canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - xAdjust)),
                Math.floor(canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - yAdjust)),
            )
            c.arc(
                Math.floor(canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - xAdjust)),
                Math.floor(canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - yAdjust)),
                Math.floor(vmaxToPx(map.tileSize)),
                startAngle, 
                endAngle, 
                false
            )
        }
        else {
            c.rect(
                Math.floor(canvas.width / 2 - vmaxToPx(thePlayer.x - this.x)),
                Math.floor(canvas.height / 2 - vmaxToPx(thePlayer.y - this.y)),
                Math.ceil(vmaxToPx(map.tileSize)), 
                Math.ceil(vmaxToPx(map.tileSize))
            )
        }
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    },
    new(info){
        return Object.create(this).init(info)
    },
}

var mapTile = {
    type: 'tile',
    strokeColor: 'blue',
    altStrokeColor: 'red',
    alt2StrokeColor: 'lime',
    init(info){
        this.debug = {
            highlight: false,
            altHighlight: false,
            highlightAll: false,
            highlightClickID: 0,
        }
        this.x = info.x
        this.y = info.y

        this.tileX = info.x / 20
        this.tileY = info.y / 20

        this.holding = []

        this.items = []

        this.lastDrawnDT = 0

        return this
    },
    hasHighlight(){
        return (
            this.debug.highlightAll || 
            this.debug.highlight || 
            this.debug.altHighlight || 
            this.debug.alt2Highlight
        )
    },
    checkIfTileIsRoad(tile){
        return (tile.holding[0] && tile.holding[0].__proto__ == road)
    },
    shouldDrawGrass(){
        return (
            (
                !this.checkIfTileIsRoad(this) || 
                this.holding[0].corner
            ) && 
            zoom.current < 5 
        )
    },
    drawSoloCircle(){
        // make all road
        c.fillStyle = OPTIONS.COLORS.road
        c.beginPath()
        c.rect(
            Math.floor(canvas.width / 2 - vmaxToPx(thePlayer.x - this.x)), 
            Math.floor(canvas.height / 2 - vmaxToPx(thePlayer.y - this.y)),
            Math.ceil(vmaxToPx(map.tileSize)),
            Math.ceil(vmaxToPx(map.tileSize)),
        )
        c.fill()
        c.closePath()
        // circle in center with grass color
        c.beginPath()
        c.arc(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - (map.tileSize / 2)), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - (map.tileSize / 2)),
            Math.floor(vmaxToPx(9.9)),
            0, 
            Math.PI * 2, 
            false
        )
        c.fillStyle = 
            zoom.current < 5 ? 
            OPTIONS.COLORS.mapBGWithGrass :
            OPTIONS.COLORS.mapBG
            
        c.fill()
        c.closePath()
        // fill grass texture in circle only

        c.save()
        c.beginPath()
        c.arc(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - (map.tileSize / 2)), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - (map.tileSize / 2)),
            Math.floor(vmaxToPx(9.9)),
            0, 
            Math.PI * 2, 
            false
        )
        c.clip()
        if (zoom.current < 5) {
            this.drawGrass()
        }
        c.closePath()
        c.restore()
    },
    drawGrass(){
        c.drawImage(
            images.grass, 
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x), 
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(map.tileSize),
            vmaxToPx(map.tileSize)
        )
    },
    drawHighlight(){
        c.beginPath()
        c.rect(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y),
            vmaxToPx(map.tileSize), 
            vmaxToPx(map.tileSize)
        )
        c.rect(
            canvas.width / 2 - vmaxToPx(thePlayer.x - this.x - 3),
            canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - 3),
            vmaxToPx(map.tileSize - 6), 
            vmaxToPx(map.tileSize - 6)
        )
        c.strokeStyle = 
            this.debug.altHighlight ? 
                this.altStrokeColor : 
            this.debug.alt2Highlight ?
                this.alt2StrokeColor :
                this.strokeColor

        c.lineWidth = 4
        c.stroke()
        c.closePath()
    },
    draw(dt, forceDraw){
        if (this.linkedFrom && !forceDraw){
            map.tiles[this.linkedFrom[0]][this.linkedFrom[1]].draw(dt)
            return
        }

        if (this.lastDrawnDT && this.lastDrawnDT == dt) return
        this.lastDrawnDT = dt

        if (this.linkedTo) {                                            
            for (var z = 0, length = this.linkedTo.length; z < length; z++){
                let [linkX, linkY] = this.linkedTo[z]
                map.tiles[linkX][linkY].draw(dt, 'forceDraw')
            }
        }






        // soloCircle takes care of grass in it's own way
        if (this.soloCircle) this.drawSoloCircle()

        // draw grass texture when zoom is less than 5 
        // and tile is not road
        // unless road tile is a corner
        else if (this.shouldDrawGrass()) this.drawGrass()

        // draw what the tile is holding
        if (this.holding.length) {
            for (var i = 0, length = this.holding.length; i < length; i++){
                this.holding[i].draw()
            }
        }

        // push tile items to draw later
        if (this.items.length) {
            theMap.drawItemsAfterTilesArray
                .push(...this.items)
        }

        // DEBUG HIGHLIGHTS
        if (this.hasHighlight()) this.drawHighlight()
    },
    new(info){
        return Object.create(this).init(info)
    },
    isHoldingHouse(){
        return this.holding[0]?.type == 'house'
    },
    isUnderHouse(){
        return this.holding[0]?.under
    },
    holdingHouseAndUnder(){
        return (
            this.isHoldingHouse &&
            this.isUnderHouse
        )
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
    isUnderHouseOrLinkedHouse(){
        return this.getHouseOrLinkedHouse()?.under
    }
}

var map = {
    tileSize: 20,
    width: 200,
    height: 200,
    tiles: [],
    allHouses: [],
    firstBox: true,
    drawItemsAfterTilesArray: [],
    drawAfterPlayerArray: [],
    type: 'map',
    init(){
        // create all map tiles
        for (var x = 0; x < this.width; x++){
            this.tiles.push([])
            for (var y = 0; y < this.height; y++){
                this.tiles[x].push(mapTile.new({
                    x: x * map.tileSize,
                    y: y * map.tileSize,
                }))
            }
        }

        
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
    draw(dt){
        var iW = canvas.width,
            iH = canvas.height,
            mapBoundsX = vmaxToPx(this.width * map.tileSize),
            mapBoundsY = vmaxToPx(this.height * map.tileSize)

        if (zoom.current == 80 && !thePlayer.zoomedAllTheWayOut){

            // when zoomed all the way out,
            // center viewport, and offset player location

            thePlayer.zoomedAllTheWayOut = true
            thePlayer.preZoomedX = thePlayer.x
            thePlayer.preZoomedY = thePlayer.y
            thePlayer.x = this.width / 2 * map.tileSize
            thePlayer.y = this.height / 2 * map.tileSize
        }
        else if (zoom.current < 80 && thePlayer.zoomedAllTheWayOut){

            // reset player location after 
            // being zoomed all the way out

            thePlayer.zoomedAllTheWayOut = false
            thePlayer.x = thePlayer.preZoomedX
            thePlayer.y = thePlayer.preZoomedY
        }

        // offset map to player location
        this.x = iW / 2 - vmaxToPx(thePlayer.x)
        this.y = iH / 2 - vmaxToPx(thePlayer.y)

        // draw map background 
        c.beginPath()

        // only draw full map if view is showing map edges
        if (mapBoundsX < iW || mapBoundsY < iH) {
            c.rect(
                this.x, 
                this.y, 
                mapBoundsX, 
                mapBoundsY
            )
        }
        else c.rect( 
            Math.max(0, this.x), 
            Math.max(0, this.y), 
            Math.min(iW, mapBoundsX + this.x), 
            Math.min(iH, mapBoundsY + this.y), 
        )

        // change map color when grass isn't drawn
        c.fillStyle = zoom.current > 5 ? OPTIONS.COLORS.mapBG : OPTIONS.COLORS.mapBGWithGrass
        // c.fillStyle = 'rgba(130, 255, 130, .1)' // EFFECT not implemented yet but works
        c.fill()
        c.closePath()

        // calculate current tile
        var currentX = Math.floor(thePlayer.x / map.tileSize)
        var currentY = Math.floor(thePlayer.y / map.tileSize)

        // draw more tiles as you zoom out
        var zoomMulti = 3 * zoom.current

        // only draw tiles that are (potentially) visible

        // tile draw fn handles LINKED TILE delegation
        for (var x = currentX - zoomMulti; x <= currentX + zoomMulti; x++){
            if (!this.tiles[x]) continue
            for (var y = currentY - zoomMulti; y <= currentY + zoomMulti; y++){
                if (!this.tiles[x][y]) continue
                this.tiles[x][y].draw(dt)
            }
        } 
    },
    drawItemsAfterTiles(dt){
        for (let i = 0, length = this.drawItemsAfterTilesArray.length; i < length; i++) {
            this.drawItemsAfterTilesArray[i].draw(dt)
        }
        this.drawItemsAfterTilesArray = []
    },
    drawAfterPlayer(){
        this.drawAfterPlayerArray.forEach(item =>
            item.drawAfterPlayer()
        )
        this.drawAfterPlayerArray = []
    },
    new(){
        return Object.create(this).init()
    },
    getTile(array){
        return this.tiles[array[0]][array[1]]
    },
    getTileHolding(array){
        return this.getTile(array).holding[0]
    },
    createCommunityBox(){
        var min = 3, 
            max = 20, 
            edgeGap = 10

        if (rand() > .75) {
            min = max = 3
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
                // this.tiles[newBox.x+1][newBox.y+1].debug.alt2Highlight = true
                this.tiles[newBox.x+1][newBox.y+1].soloCircle = true
                this.tiles[newBox.x+1][newBox.y+1].holding.push(tree.new({
                    x: newBox.x+1,
                    y: newBox.y+1,
                }))

                // FIND SMALLEST COMMUNITY AND DONT ALLOW HOUSE
                forceConnectingRoad = true
            }
            // create outer roads for box
            for (var x = newBox.x; x < newBox.x + newBox.width; x++){
                for (var y = newBox.y; y < newBox.y + newBox.height; y++){
                    if (x >= newBox.x && 
                        x < newBox.x + newBox.width &&
                        y >= newBox.y &&
                        y < newBox.y + newBox.height &&
                            (x == newBox.x ||
                            y == newBox.y ||
                            x == newBox.x + newBox.width - 1 ||
                            y == newBox.y + newBox.height - 1)) {
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
            // [box.shortestBox, box.secondShortestBox].forEach(otherBox => {
                box.shortestBoxes.forEach(otherBox => {

                // if two communities are linked to each other
                // unlink them, and skip the first one
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

                // draw horizontal roads
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
        function getConnectedRoads(x, y){
            connectedRoads = []
            if (theMap.tiles[x - 1][y].holding[0]) 
                connectedRoads.push( {x: -1, y: 0} ) // left

            if (theMap.tiles[x + 1][y].holding[0]) 
                connectedRoads.push( {x: 1, y: 0} ) // right

            if (theMap.tiles[x][y - 1].holding[0]) 
                connectedRoads.push( {x: 0, y: -1} ) // up

            if (theMap.tiles[x][y + 1].holding[0]) 
                connectedRoads.push( {x: 0, y: 1} ) // down

            return connectedRoads
        }
        function debugHighlight(currentTile, firstPass){
            if (OPTIONS.DEV.DEBUG.HIGHLIGHT_REMOVED_TILES) {
                if (firstPass) currentTile.debug.altHighlight = true
                else currentTile.debug.highlight = true
            }
        }

        let deleteCount = 0,
            allRoads = 
                theMap.tiles.reduce((a, c) => 
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
                let currentTile = theMap.tiles[tileX][tileY]
                
                debugHighlight(currentTile, firstPass)
                firstPass = false

                currentTile.holding.pop()
                deleteCount++

                if (!connectedRoads.length) break

                tileX += connectedRoads[0].x
                tileY += connectedRoads[0].y
                
                connectedRoads = getConnectedRoads(tileX, tileY)
            }
        }
        if (OPTIONS.DEV.DEBUG.HIGHLIGHT_REMOVED_TILES)
            console.log('Road Clean Up Count: ', deleteCount)
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
        var globalChance = 1,

            house1Chance = .2 * globalChance,
            house2Chance = .1 * globalChance,
            house3Chance = .05 * globalChance

        function validateNonCornerNonConnectingRoads(...args){
            // checks [x, y] of every [] passed
            var testPassed = true
            for (var i = 0, length = args.length; i < length; i++){
                if (!(
                    theMap.tiles[args[i][0]][args[i][1]].holding[0] &&
                    theMap.tiles[args[i][0]][args[i][1]].holding[0].__proto__ == road &&
                    !theMap.tiles[args[i][0]][args[i][1]].holding[0].corner &&
                    !theMap.tiles[args[i][0]][args[i][1]].holding[0].connectingRoad
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

                let tile = theMap.tiles[args[i][0]][args[i][1]]

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
                    tileY: tile.tileY
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
        var allEmptyTiles = 
            theMap.tiles.reduce((a, c) =>
                a.concat(c.filter(tile =>
                    !tile.holding[0] && !tile.linkedFrom
                ))
            , [])

        var edgeGap = 13 * map.tileSize
        for (var i = 0, length = allEmptyTiles.length; i < length; i++) {
            let tile = allEmptyTiles[i]
            if (
                tile.x < edgeGap ||
                tile.x > theMap.width * map.tileSize - edgeGap ||
                tile.y < edgeGap ||
                tile.y > theMap.height * map.tileSize - edgeGap
                ) continue

            if (rand() > .99) {
                tile.holding.push(tree.new({
                    x: tile.x/20,
                    y: tile.y/20
                }))
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
        // tile.debug.highlight = true

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
                        style: {
                            type: 'circle',
                            r: .25
                        },
                        tag,
                    })
                )
                tempSpawnArray.splice(randomSpawnIndex, 1)
            }
        }
    },
    generate(){
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
    }
}

var player = {
    r: 1,
    color: '#292',
    type: 'player',
    new(){
        return Object.create(this).init()
    },
    init(){
        // SPAWN RANDOM ROAD
        var [spawnX, spawnY] = map.pickRandomPlayerSpawnPoint()
        this.x = spawnX
        this.y = spawnY

        if (OPTIONS.DEV.DEBUG.SPAWN_IN_CORNER) {
            this.x = 20
            this.y = 20
        }

        // SPAWN SPECIFIC LOCATION
        // this.x = 20
        // this.y = 20

        // SPAWN MAP CENTER
        // this.x = theMap.width / 2 * map.tileSize
        // this.y = theMap.height / 2 * map.tileSize

        return this
    },
    draw(){
        c.beginPath()
        if (this.zoomedAllTheWayOut){
            c.arc(
                theMap.x + vmaxToPx(this.preZoomedX), 
                theMap.y + vmaxToPx(this.preZoomedY), 
                vmaxToPx(this.r * zoom.current/3),
                0, 
                Math.PI * 2, 
                false
            )

        }
        else {
            c.arc(
                canvas.width / 2, 
                canvas.height / 2, 
                vmaxToPx(this.r * (zoom.current > 5 ? zoom.current/3 : 1)), // change player size when zoomed out
                0, 
                Math.PI * 2, 
                false
            )
        }
        c.fillStyle = this.color
        c.fill()


    },
    updatePosition(t){
        if (zoom.current > 2) return

        var dx = 0, dy = 0, multi = 50

        if (keys.states.w) dy += t*(-1) / multi
        if (keys.states.s) dy += t / multi
        if (keys.states.a) dx += t*(-1) / multi
        if (keys.states.d) dx += t / multi

        if (Math.abs(dx) + Math.abs(dy) == 0) return

        // scale speed if diagonal direction
        dx *= 1 / (Math.abs(dx) / t * multi + Math.abs(dy) / t * multi)
        dy *= 1 / (Math.abs(dx) / t * multi + Math.abs(dy) / t * multi)

        if (!keys.states.shift) {
            dx /= 1.5
            dy /= 1.5
        }
        if (keys.states.capslock) {
            dx *= 100
            dy *= 100
        }

        let [colX, colY] = this.checkCollision(dx, dy)

        if (!colX) this.x += dx
        if (!colY) this.y += dy

    },
    checkCollision(dx, dy){
        var colX = false, colY = false

        tileCol = Math.floor(this.x / map.tileSize)
        tileRow = Math.floor(this.y / map.tileSize)

        // MAIN MAP WALL COLLISION
        if (tileRow + dx <= 0 ||
            tileCol + dy <= 0 ||
            tileRow + dx >= theMap.width - 1 ||
            tileCol + dy >= theMap.height - 1) {
            if (this.x - this.r + dx < 0) colX = true
            if (this.y - this.r + dy < 0) colY = true
            if (this.x + this.r + dx > theMap.width * map.tileSize) colX = true
            if (this.y + this.r + dy > theMap.height * map.tileSize) colY = true
        }


        // CHECK 3x3 TILES AROUND PLAYER
        for (var x = tileCol - 1; x <= tileCol + 1; x++){
            for (var y = tileRow - 1; y <= tileRow + 1; y++){

                if (!theMap.tiles[x] || !theMap.tiles[x][y]) continue
                let tile = theMap.tiles[x][y]

                if (tile.items.length) {
                    for (var i = 0, length = tile.items.length; i < length; i++) {
                        tile.items[i].checkCollision()
                    }
                }

                // check holding for house

                // if linked tile, set house variable to main tile's house
                if (tile.linkedFrom) {
                    var houseHere = theMap.tiles[tile.linkedFrom[0]][tile.linkedFrom[1]].holding[0]
                }

                // if not linked tile, check if tile is holding a house
                else {
                    if (!tile.holding[0]) continue
                    if (tile.holding[0].__proto__ != house) continue

                    var houseHere = tile.holding[0]
                }


                // check house items
                houseHere.checkItemsCollision()

                // check mainCollision
                var mainCol = houseHere.mainCollision

                if (this.x + this.r + dx > mainCol.x &&
                    this.x - this.r + dx < mainCol.x + mainCol.width &&
                    this.y + this.r + dy > mainCol.y &&
                    this.y - this.r + dy < mainCol.y + mainCol.height) {

                    // check walls
                    for (var i = 0, length = houseHere.boxes.length; i < length; i++){
                        if (this.x + this.r + dx > houseHere.boxes[i].x &&
                            this.x - this.r + dx < houseHere.boxes[i].x + houseHere.boxes[i].width &&
                            this.y + this.r + dy > houseHere.boxes[i].y &&
                            this.y - this.r + dy < houseHere.boxes[i].y + houseHere.boxes[i].height) {
                            if (this.x + this.r > houseHere.boxes[i].x &&
                                this.x - this.r < houseHere.boxes[i].x + houseHere.boxes[i].width) {
                                    colY = true
                            }
                            if (this.y + this.r > houseHere.boxes[i].y &&
                                this.y - this.r < houseHere.boxes[i].y + houseHere.boxes[i].height) {
                                    colX = true
                            }
                        }
                    }

                    // ONLY CHECK ROOF IF NOT ALREADY UNDER ROOF, AND THERE'S NO WALL COLLISION
                    // (kind of) PREVENTS ROOF COLLISION FROM PLAYER THATS OUTSIDE HOUSE 
                    if ((colX || colY) && !houseHere.under) continue 

                    // check roof
                    for (var i = 0, length = houseHere.roofs.length; i < length; i++){
                        var count = 0
                            for (var j = 0, length2 = houseHere.roofs[i].sections.length; j < length2; j++){
                            if (this.x + this.r + dx > houseHere.roofs[i].sections[j].x &&
                                this.x - this.r + dx < houseHere.roofs[i].sections[j].x + houseHere.roofs[i].sections[j].width &&
                                this.y + this.r + dy > houseHere.roofs[i].sections[j].y &&
                                this.y - this.r + dy < houseHere.roofs[i].sections[j].y + houseHere.roofs[i].sections[j].height) {
                                    count++
                                }
                        }
                        if (count) {
                            houseHere.under = true
                        }
                        else if (houseHere.under) {
                            houseHere.under = false
                        }
                    }


                    // check ITEM ZONE collision boxes
                    for (var i = 0, length = houseHere.itemZones.length; i < length; i++) {
                        var zone = houseHere.itemZones[i]

                        if (
                            this.x > zone.x &&
                            this.x < zone.x + zone.width &&
                            this.y > zone.y &&
                            this.y < zone.y + zone.height
                        ) {
                            if (houseHere.currentItemZone !== zone.tag) {
                                houseHere.currentItemZone = zone.tag
                            }
                        }
                    }
                }
            }
        }
        return [colX, colY]
    },
    getCurrentTile(){
        return (
            map.tiles
                [Math.floor(this.x / map.tileSize)]
                [Math.floor(this.y / map.tileSize)]
        )
    },
    items: {
        holding: [],
        canShowInfo: [],
        isShowingInfo: null,
        showingIndex: -1,
        addToCanShow(item){
            // console.log('ADD: ', item.itemType)
            this.canShowInfo.push(item)
            if (!this.isShowingInfo) {
                this.isShowingInfo = item
                this.showingIndex = 0
            }
        },
        setCurrentShowing(){
            this.isShowingInfo = this.canShowInfo[this.showingIndex]
        },
        removeFromCanShow(item){
            var index = this.canShowInfo.indexOf(item)

            if (index == -1) return console.log('item not found', item)

            if (this.showingIndex > 0) this.showingIndex-- 

            this.canShowInfo.splice(index, 1)
            // console.log('REMOVE: ', item.itemType)

            if (!this.canShowInfo.length) {
                // console.log('minus one')
                this.showingIndex = -1
                this.isShowingInfo = null
            }
            else {
                // console.log('Changing ShowingInfo - INDEX: ', this.showingIndex, this.canShowInfo)
                this.setCurrentShowing()
            }
        },
        cycle(dir){
            if (this.canShowInfo.length < 2) return
            if (dir == 'right') {
                if (++this.showingIndex > this.canShowInfo.length - 1) {
                    this.showingIndex = 0
                }
            }
            else if (dir == 'left') {
                if (--this.showingIndex < 0) {
                    this.showingIndex = this.canShowInfo.length - 1
                }
            }
            this.setCurrentShowing()
        },
        dropItem(item){
            if (!this.holding.length) return
            var tile = thePlayer.getCurrentTile(),
                index = this.holding.findIndex(x => x == item)

            // remove from player holding
            this.holding.splice(index, 1)

            if (index < 0) return console.log('item not found for drop')
    
            // set item location
            item.x = thePlayer.x
            item.y = thePlayer.y
    
            item.tileX = tile.tileX
            item.tileY = tile.tileY
            
            // add to house items if player in house
            if (tile.isUnderHouseOrLinkedHouse()) {
                let house = tile.getHouseOrLinkedHouse()
                item.tag = house.currentItemZone
                    house.items.push(item)
            }
            // or add to current tile items
            else tile.items.push(item)

            // turn on item information immediately
            item.checkCollision()

            // update inventory
            thePlayer.inventory.updateList()
        },
    },
    handleKeyF(){
        if (this.items.isShowingInfo) {
            this.items.isShowingInfo.pickItemUp()
            this.items.removeFromCanShow(this.items.isShowingInfo)
        }
    },
    inventory: {
        x: 6,
        y: 20,
        width: 10,
        height: 20,
        openState: true,
        selectedIndex: 0,
        // list: [['yo', 'sup'], ['yo', 'sup'], ['yo', 'sup'], ['yo', 'sup'], ['yo', 'sup'], ['yo', 'sup']],
        list: [],
        updateList(){
            this.list = []
            var holding = thePlayer.items.holding

            // create list from held items
            // if item already there, increment count
            // else create item with count 1 in list
            for (var i = 0, length = holding.length; i < length; i++) {
                let index = this.list.findIndex(x => x[0] == holding[i].itemType)
                if (index > -1) this.list[index][1]++
                else this.list.push(
                    [holding[i].itemType, 1]
                )
            }

            // sort item type alphabetically
            this.list.sort((a, b) => a[0] > b[0] ? 1 : -1)

            // clamp selected index
            this.selectedIndex = 
                Math.min(
                    Math.max(
                        this.selectedIndex, 0
                    ), this.list.length - 1
                )
        },
        toggleOpenState(){
            this.openState = !this.openState
        },
        draw(){
            if (zoom.current > 2) return
            this.drawMainLabel()

            // display 'empty...' if not holding items
            if (!this.list.length) this.drawEmptyList()

            // display items list
            for (var i = 0, length = this.list.length; i < length; i++){
                this.drawListItems(i)

                // SELECTED ITEM
                if (this.selectedIndex == i) { 
                    this.drawButtonsGE(i)
                    if (this.list.length > 1) this.drawUpDownArrows(i)
                }
            }
        },
        drawListItems(i){
            c.beginPath()

            // item type
            c.font = vmaxToPxReal(1.25) + 'px Arial'
            c.fillStyle = 'white'
            c.textAlign = 'left'
            c.fillText(this.list[i][0], 
                vmaxToPxReal(this.x + 1) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 2 - i* 2),
            )

            // item amount
            c.textAlign = 'right'
            c.fillText(this.list[i][1], 
                vmaxToPxReal(this.x + this.width - 1) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 2 - i* 2),
            )
            c.closePath()
        },
        drawEmptyList(){
            // 'empty...' text
            c.beginPath()
            c.font = vmaxToPxReal(1.25) + 'px Arial'
            c.fillStyle = 'white'
            c.textAlign = 'left'
            c.fillText('empty...', 
                vmaxToPxReal(this.x + 1) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 2),
            )
            c.closePath()
        },
        drawMainLabel(){
            // 'Inventory' text
            c.beginPath()
            c.fillStyle = 'white'
            c.textAlign = 'center'
            c.font = vmaxToPxReal(1.5) + 'px Arial'

            c.fillText('Inventory', 
                vmaxToPxReal(this.x + (this.width / 2)) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 + 1),
            )

            // line under 'Inventory
            c.lineWidth = 1
            c.strokeStyle = 'gray'
            c.moveTo(
                vmaxToPxReal(this.x) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2)
            )
            c.lineTo(
                vmaxToPxReal(this.x + this.width),
                canvas.height / 2 - vmaxToPxReal(this.height / 2)
            )
            c.stroke()
            c.closePath()
        },
        drawButtonsGE(i){
            c.beginPath()  
            c.strokeStyle = 'gray'  
            c.lineWidth = 1
            
            // border
            c.rect(
                vmaxToPxReal(this.x) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i)),
                vmaxToPxReal(this.width),
                vmaxToPxReal(1.5),
            )

            // G SQUARE
            c.rect(
                vmaxToPxReal(this.x + this.width + 1.25) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i)),
                vmaxToPxReal(1.5),
                vmaxToPxReal(1.5),
            )

            // E SQUARE
            c.rect(
                vmaxToPxReal(this.x + this.width + 3.25) , 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i)),
                vmaxToPxReal(1.5),
                vmaxToPxReal(1.5),
            )
            c.stroke()

            c.fillStyle = 'white'
            c.textAlign = 'left'

            c.font = vmaxToPxReal(.6) + 'px Arial'

            // '(drop)' text
            c.fillText('(drop)', 
                vmaxToPxReal(this.x  + this.width + 1.15), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i) - 2.25),
            )

            // '(use)' text
            c.fillText('(use)', 
                vmaxToPxReal(this.x  + this.width + 3.32), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i) - 2.25),
            )

            c.font = vmaxToPxReal(.75) + 'px Arial'

            // 'E' text
            c.fillText('E', 
                vmaxToPxReal(this.x  + this.width + 3.5), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i) - .75),
            )

            // 'G' text
            c.fillText('G', 
                vmaxToPxReal(this.x  + this.width + 1.5), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i) - .75),
            )
            c.closePath()
        },
        drawUpDownArrows(i){

            // ^ up arrow SQUARE
            c.beginPath()
            c.strokeStyle = 'gray'
            c.rect(
                vmaxToPxReal(this.x - 4.75), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i)),
                vmaxToPxReal(1.5),
                vmaxToPxReal(1.5),
            )

            // v down arrow SQUARE
            c.rect(
                vmaxToPxReal(this.x - 2.75), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - .75 - (2 * i)),
                vmaxToPxReal(1.5),
                vmaxToPxReal(1.5),
            )
            c.stroke()
            c.closePath()

            // UP ^ ARROW
            c.beginPath()
            c.lineWidth = 1.5
            c.strokeStyle = 'white'
            c.moveTo(
                vmaxToPxReal(this.x - 4), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1 - (2 * i)),
            )
            c.lineTo(
                vmaxToPxReal(this.x - 4), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.6 - (2 * i)),
            ) 
            c.moveTo(
                vmaxToPxReal(this.x - 4.25), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.25 - (2 * i)),
            )
            c.lineTo(
                vmaxToPxReal(this.x - 4), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1 - (2 * i)),
            ) 
            c.lineTo(
                vmaxToPxReal(this.x - 3.75), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.25 - (2 * i)),
            ) 

            // DOWN v ARROW
            c.moveTo(
                vmaxToPxReal(this.x - 2), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.4 - (2 * i)),
            )
            c.lineTo(
                vmaxToPxReal(this.x - 2), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 2 - (2 * i)),
            ) 
            c.moveTo(
                vmaxToPxReal(this.x - 2.25), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.75 - (2 * i)),
            )
            c.lineTo(
                vmaxToPxReal(this.x - 2), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 2 - (2 * i)),
            ) 
            c.lineTo(
                vmaxToPxReal(this.x - 1.75), 
                canvas.height / 2 - vmaxToPxReal(this.height / 2 - 1.75 - (2 * i)),
            ) 
            c.stroke()
            c.closePath()
        },
        cycle(dir){
            if (!this.openState) return
            
            if (dir == 'down') {
                this.selectedIndex++
                if (this.selectedIndex > this.list.length - 1)
                    this.selectedIndex = 0
            }
            else if (dir == 'up') {
                this.selectedIndex--
                if (this.selectedIndex < 0)
                    this.selectedIndex = this.list.length - 1
            }
        },
        dropItem(){
            if (!this.openState) return
            if (!this.list.length) return

            var itemType = this.list[this.selectedIndex][0]
            var item = thePlayer.items.holding.find(item => item.itemType == itemType)

            thePlayer.items.dropItem(item)
        },
    },
};

var chat = {
    wrap: null,
    closeTimeout: null,
    chatOpenFromMouseOver: false,
    worldMsgArray: [],
    init(){
        this.wrap = el('.div-chat-wrap')
        this.wrap.onclick = this.view.handleViewClick
        this.wrap.onmouseenter = ()=> this.view.handleViewMouseEnter()
        this.wrap.onmouseleave = ()=> this.view.handleViewMouseLeave()

        this.typing.init()
        this.view.init()
    },
    startCloseTimeout(){
        this.cancelCloseTimeout()

        this.closeTimeout = setTimeout(
            ()=> this.closeChat(),
            2000
        )
    },
    cancelCloseTimeout(){
        clearTimeout(this.closeTimeout)
    },
    openChat(){
        chat.cancelCloseTimeout()
        this.wrap.setAttribute('show', '')
    },
    closeChat(){
        this.wrap.removeAttribute('show')
        this.chatOpenFromMouseOver = false
    },

    io: {
        handleReceiveMessage(data){
            chat.view.addMessage({
                icons: data.icons,
                user: data.user,
                msg: data.message
            })
            if (zoom.current == 80) {
                chat.worldMsg.new({
                    text: data.message,
                    x: thePlayer.preZoomedX,
                    y: thePlayer.preZoomedY,
                })
            }
            else {
                chat.worldMsg.new({
                    text: data.message,
                    x: thePlayer.x,
                    y: thePlayer.y,
                })
            }
            if (zoom.current > 5) animate()
        },
        handleSendMessage(msg){
            websocket.sendSocketObj({
                type: 'message',
                icons: true,
                user: websocket.id,
                message: msg
            })
        },
    },

    // section to type in chat
    typing: {
        init(){
            this.ref = el('.input-chat')
            this.formRef = el('.form-chat')
    
            this.formRef.onsubmit = e => this.handleSubmit(e)
        },
        formRef: null,
        ref: null,
        state: false,
        changeState(bool){
            this.state = bool

            if (bool) {
                this.formRef.removeAttribute('hide')
                chat.openChat()

                if (chat.chatOpenFromMouseOver) {
                    chat.chatOpenFromMouseOver = false
                }

                setTimeout(()=>this.focusInput())
            }
            else {
                this.formRef.setAttribute('hide', '')
                this.clearInput()

                chat.startCloseTimeout()
            }
        },
        clearInput(){ this.ref.value = '' },
        focusInput(){ this.ref.focus() },
        handleKeys(e){
            if (
                    e.key == 'Escape' ||
                    e.key == 'Enter' && this.ref.value == ''
                ) {
                this.cancelMessage()
                this.ref.blur()
            }
        },
        handleSubmit(e){
            e.preventDefault()
            this.submitMessage(e.target[0].value)
        },
        submitMessage(msg){
            if (msg) {
                chat.io.handleSendMessage(msg)
                // do message here first
                this.clearInput()
            }
        },
        cancelMessage(){
            this.changeState(false)
        }
    },

    // section to view recent chats
    view: {
        ref: null,
        init(){
            this.ref = el('.div-chat')
        },
        createMessageElements(obj){
            var wrap = div('div-chat-line-wrap'),
                nameIconWrap = div('div-chat-line-name-icon-wrap', wrap)

            if (obj.icons) div('div-chat-line-icon-wrap', nameIconWrap)

            var user = div('div-chat-line-user', nameIconWrap)
            user.innerText = obj.user + ': '

            var msg = div('div-chat-line-message', wrap)
            msg.innerText = obj.msg

            return wrap
        },
        addMessage(obj){
            this.ref.append(
                this.createMessageElements(obj)
            )

            if (this.ref.childElementCount > 100){
                this.ref.childNodes[0].remove()
            }
            this.scrollToBottom()
        },
        scrollToBottom(){
            this.ref.scrollTop = this.ref.scrollHeight
        },
        handleViewClick(e){
            e.stopPropagation()
            if (getSelection().toString()) return
            if (chat.typing.state) chat.typing.focusInput()
            else chat.typing.changeState(true)
        },
        handleViewMouseEnter(){
            if (chat.typing.state) return
            chat.openChat()
            chat.chatOpenFromMouseOver = true
        },
        handleViewMouseLeave(){
            if (!chat.chatOpenFromMouseOver) return
            chat.chatOpenFromMouseOver = false
            chat.startCloseTimeout()
        },
    },

    // chat message that pops up next to player
    worldMsg: {
        size: 1,
        visLength: 5000,
        minVelX: .25,
        maxVelY: 2,
        init(obj){
            this.text = this.formatText(obj.text)
            this.x = obj.x
            this.y = obj.y

            this.opacity = 1
            this.velX = 2
            this.velY = .5

            this.startDt = 0
            this.lastDt = 0

            this.opacity = 0
            this.fadingIn = true

            chat.worldMsgArray.push(this)

            return this
        },
        new(obj){ return Object.create(this).init(obj) },
        formatText(text){
            var split = text.trim().split(' '),
                lineLength = 150, // pixels
                wordLength = 30 // characters
                
            // split words longer than 'wordLength'
            // into seperate lines

            for (var i = 0; i < split.length; i++) {
                if (split[i].length > wordLength) {
                    let start = split[i].substr(0, wordLength),
                        end = split[i].substr(wordLength)
                    
                    split[i] = start
                    split.splice(i + 1, 0, end)
                }
            }
            
            var newArray = [split[0]]

            // split words into lines 
            // not longer than line length ( measures pixels )

            for (var i = 1, length = split.length; i < length; i++) {
                if ( 
                    this.measureText(
                        newArray[newArray.length - 1] +
                        ' ' + split[i]
                    ) > lineLength
                ) {
                    newArray.push(split[i])
                }
                else {
                    newArray[newArray.length - 1] += ' ' + split[i]
                }
            }

            return newArray
        },
        measureText(text){
            // used by 'formatText'
            c.save()

            c.font = 10 + 'px Arial'
            var { width } = c.measureText(text)

            c.restore()

            return width
        },
        update(dt){

            // set start time
            if (!this.startDt) {
                this.startDt = this.lastDt = dt
            }

            // get total time it's been visible
            var visTime = dt - this.startDt

            // destroy after vis time reaches max
            if (visTime > this.visLength) {
                this.isDestroying = true
                this.destroy()
            }

            // update
            else {
                // get change in delta time
                var dtChange = dt - this.lastDt

                this.lastDt = dt

                // update velocity based on time
                // moves right fast, then slows
                // moves up slow, then speeds up
                this.velX = Math.max(
                    this.velX - .001 * dtChange,
                    this.minVelX
                )
                this.velY = Math.min(
                    this.velY + .00025 * dtChange,
                    this.maxVelY
                )

                // location change
                this.x += this.velX * dtChange / 1000
                this.y -= this.velY * dtChange / 1000

                // fade in opacity, then fade out
                var opacityFromTime = 
                    (this.visLength - visTime) / this.visLength

                if (this.fadingIn) {
                    this.opacity = 
                        Math.min(
                            this.opacity + dtChange / 1000,
                            1
                        )
                    if (this.opacity > opacityFromTime) {
                        this.fadingIn = false
                    }
                }
                else this.opacity = opacityFromTime
            }
            // true means update happened
            // false means it was destroyed
            return !this.isDestroying
        },
        draw(){
            for (var i = 0, length = this.text.length; i < length; i++){
                c.beginPath()
                c.shadowColor = 'black'
                c.shadowBlur = vmaxToPx(.25)
                c.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
                c.textAlign = 'left'
                c.font = vmaxToPx(this.size) + 'px Arial'

                c.fillText(this.text[i], 
                    canvas.width / 2 - vmaxToPx(thePlayer.x - this.x),
                    canvas.height / 2 - vmaxToPx(thePlayer.y - this.y - i * 1.5),
                )
                c.shadowBlur = vmaxToPx(0)
                c.closePath()
            }
        },
        destroy(){
            var index = chat.worldMsgArray.indexOf(this)
            chat.worldMsgArray.splice(index, 1)
        },
    },
    drawWorldMessages(dt){
        if (!this.worldMsgArray.length) return

        for (var i = this.worldMsgArray.length - 1; i >= 0; i--){
            if (this.worldMsgArray[i].update(dt) &&
                zoom.current < 5) 
                this.worldMsgArray[i].draw()
        }
    },
}

const animate = (function animWrap(){
    function go(){
        if (animState) return
        animState = true
        requestAnimationFrame(doAnimate)
    }
    var lastT = 0,
        animState = false
    function doAnimate(dt){
        if (!dt) return requestAnimationFrame(doAnimate)
    
        c.clearRect(0, 0, canvas.width, canvas.height) 
    
        // FX CLEAR RECT
        // c.beginPath()
        // c.fillStyle = 'rgba(0, 0, 0, .5)'
        // c.rect(0, 0, canvas.width, canvas.height)
        // c.fill()
        // c.closePath()

        var dtChange = dt - lastT
    
        thePlayer.updatePosition(dtChange)
    
        lastT = dt
    
        theMap.draw(dt)
    
        theMap.drawItemsAfterTiles(dtChange)
    
        thePlayer.draw()
    
        theMap.drawAfterPlayer()

        chat.drawWorldMessages(dt)

        if (thePlayer.inventory.openState) thePlayer.inventory.draw()
    
        if (zoom.current > 5) return animState = false

        requestAnimationFrame(doAnimate)
    }
    return go
})()

/////////////////////////////
/////////////////////////////

const websocket = {
    ws: null,
    id: 0,
    init(){
        this.createWebSocket()
        this.setSocketListeners()
    },
    createWebSocket(){
        this.ws = 
            new WebSocket(
                'ws://localhost:5000'
            )
    },
    setSocketListeners(){
        this.ws.onmessage = 
            this.handleSocketMessage.bind(this)

        this.ws.onopen = 
            this.handleSocketOpen.bind(this)

        this.ws.onclose = 
            this.handleSocketClose.bind(this)
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
    sendSocketObj(data){
        this.ws.send(
            JSON.stringify(data)
        )
    },
    handleSocketMessage( { data } ){
        if (!this.verifyJSON(data)) return

        data = JSON.parse(data)

        switch (data.type) {
            case 'init': 
                this.handleSocketInit(data)
                break

            case 'message':
                chat.io.handleReceiveMessage(data)
                break

            case 'map':
                console.log(data.map)
                break
        }
    },
    handleSocketOpen(){
        if (!this.rejoin.state) return

        this.rejoin.reset()

        console.log('WebSocket reconnected: ', new Date())
    },
    handleSocketClose(){
        if (!this.rejoin.state) {
            this.rejoin.state = true

            console.log('WebSocket disconnected: ', new Date())
        }

        this.rejoin.timeout = 
            setTimeout(
                this.init.bind(this),
                this.rejoin.attempt++ * 1000 + 
                Math.random() * 500
            )
    },
    rejoin: {
        state: false,
        attempt: 0,
        timeout: null,
        reset(){
            clearTimeout(this.timeout)
            this.attempt = 0
            this.state = false
        },
    },
    handleSocketInit(data){
        if (data.force) {
            return this.id = data.id
        }

        else if (!this.id) {
            this.id = data.id
        }
        this.sendSocketObj({
            type: 'init',
            id: this.id,
        })
    },
}