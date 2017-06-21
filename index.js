
exports = module.exports = {
  MessageClient: require('./src/MessageClient'),
  MessageServer: require('./src/MessageServer')
}


let buf = Buffer.from('buffer');
console.log(buf.length.toString().length);