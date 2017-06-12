let PREAMBLE = '$ipc$'; // delimiter

exports = module.exports = MessageCodec;

function MessageCodec(options) {
  options = options || {};
}

MessageCodec.prototype.encode = function(data) {
  return PREAMBLE + data;
};

MessageCodec.prototype.decode = function(srcBuffer, onMessage) {
  srcBuffer.toString().split(PREAMBLE).forEach(message => messageComplete);
  function messageComplete(message) {
    onMessage(message);
  }
};




