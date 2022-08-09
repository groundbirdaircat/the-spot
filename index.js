const express = require('express')
const app = express()
const http = require('http')

app.disable('x-powered-by')

app.use(express.static(__dirname + '/public'))

const server = http.createServer( app )
require('./lib/wsserver.js').start( server )

console.log()

app.set('port', process.env.PORT || 3000)
server.listen(
    app.get('port'), 
    function onAppListening() {
        console.log(
            '          ' + 
            'Express Listening: ', 
            app.get('port')
        )
    }
) 


// ADD FILE / LINE TRACE TO CONSOLE MESSAGES
// https://stackoverflow.com/a/60305881/15999216

const path = require('path');

['debug', 'log', 'warn', 'error', 'info'].forEach((methodName) => {

    const originalLoggingMethod = console[methodName];

    console[methodName] = (...theArguments) => {

        const originalPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (_, stack) => stack;
        const callee = new Error().stack[1];
        Error.prepareStackTrace = originalPrepareStackTrace;

        const relativeFileName = path.basename(callee.getFileName(), '.js');
        const prefix = `${relativeFileName} : ${callee.getLineNumber()}`;

        originalLoggingMethod(...theArguments, "\x1b[36m", prefix, '\n', "\x1b[0m");
    };
});