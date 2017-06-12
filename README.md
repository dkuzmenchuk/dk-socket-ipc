# Socket IPC

WebSocket-like communications over local UNIX sockets

## Installation

```
$ npm install dk-socket-ipc
```

## Creating a Message Server

```js
var ipc = require('dk-socket-ipc')

var server = new ipc.MessageServer('/tmp/socket-loc')

server.on('message', function(message) {
  console.log('got message:', message.data)
  server.send('back at you: ' + message.data)
})

server.on('connection', function(connection) {
  console.log('client connected')
})

server.start()
```

## Connecting To a Message Server

```js
var ipc = require('dk-socket-ipc')

var client = new ipc.MessageClient('/tmp/socket-loc')

client.on('connection', function(connection) {
  console.log('connected. sending greetings...')
  client.send('greetings')
})

client.on('message', function(message) {
  console.log('got message:', message.data)
})

client.start()
```