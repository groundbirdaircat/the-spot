const express = require('express')
const app = express()

app.disable('x-powered-by')

app.use(express.static(__dirname + '/public'))

require('./lib/wsserver.js')

console.log()

app.set('port', process.env.PORT || 3000)
app.listen(
    app.get('port'), 
    function onAppListening() {
        console.log(
            '          ' + 
            'Express Listening: ', 
            app.get('port')
        )
        console.log()
    }
) 