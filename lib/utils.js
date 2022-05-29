// UNIQUE ID

const uniqueID = {
    // public
    generateUniqueID(){
        var newID = ''

        for (let i = 6; i > 0; i--) {
            if (rand() > .5)
                newID += this.getRandomLetter()

            else newID += randFloor(10)
        }

        if (this.allIDs.includes(newID)) 
            return this.generateUniqueID()

        this.allIDs.push(newID)

        return newID
    },
    removeIDFromAllIDs(id){
        var index = this.allIDs.indexOf(id)

        if (index < 0)
            return console.log(
                'tried to remove ID but no ID was found'
            )

        this.allIDs.splice(index, 1)
    },
    checkIfIDExists(id){
        return this.allIDs.includes(id)
    },

    // private
    allIDs: [],
    alphabet: 'abcdehijklmopqruvwxyz' +
              'ABCDEHIJKLMOPQRUVWXYZ',
    getRandomLetter(){
        return this.alphabet[
            randFloor(this.alphabet.length)
        ]
    }
}

// RANDOMS

// public
function rand(min, max){
    [min, max] = setRandMinMax(min, max)
    return Math.random()*(max-min)+min
}

function randFloor(min, max){
    [min, max] = setRandMinMax(min, max)
    return Math.floor(Math.random()*(max-min)+min)
}

// private
function setRandMinMax(min, max){
    if (min == undefined && 
        max == undefined) [min, max] = [0, 1]
    else if (max == undefined) {
        max = 0
    }
    if (max < min) [min, max] = [max, min]
    return [min, max]
}

module.exports = {
    uID: {
        generate: uniqueID.generateUniqueID.bind(uniqueID),
        remove: uniqueID.removeIDFromAllIDs.bind(uniqueID),
        checkIfIDExists: uniqueID.checkIfIDExists.bind(uniqueID)
    },
    rand,
    randFloor
}