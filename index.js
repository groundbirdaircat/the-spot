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