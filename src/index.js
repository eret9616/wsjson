
const WebSocket = require('./wrapper')

function wsjson (url,options) {
    return new WebSocket(url, options);
}

module.exports = wsjson
