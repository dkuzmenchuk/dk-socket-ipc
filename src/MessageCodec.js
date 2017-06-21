const PREAMBLE = 35; // '#' character

const DECODE_STATE_INITIAL     = 0;
const DECODE_STATE_READ_LENGTH = 1;
const DECODE_STATE_READ_DATA   = 2;

exports = module.exports = MessageCodec;

function MessageCodec(options) {
    options = options || {};
    this._binary = !!options.binary;
    this._decodeState = DECODE_STATE_INITIAL;
    this._lengthBuf = [];
    this._decodeBufferPos = 0;
}

/**
 *
 * @param data String, if the 'utf8' option is set, or Buffer otherwise.
 * @return Buffer with preamble and length, followed by the original data.
 */
MessageCodec.prototype.encode = function(data) {
    let buffer = this._binary ? data : new Buffer(data, 'utf8');
    let length = buffer.length;
    let lengthBuffer = Buffer.from(length.toString());
    let encoded = new Buffer(length + 2 + lengthBuffer.length);
    let pos = 0;
    encoded.writeUInt8(PREAMBLE, pos++);
    lengthBuffer.copy(encoded, pos, 0, lengthBuffer.length);
    pos += lengthBuffer.length;
    encoded.writeUInt8(PREAMBLE, pos++);
    buffer.copy(encoded, pos, 0, buffer.length);
    return encoded;
};

/**
 *
 * @param srcBuffer Buffer containing incoming bytes
 * @param onMessage function with the signature callback(message). Called each time a complete message is read.
 * @returns {Array} Array of buffers containing decoded messages.
 */
MessageCodec.prototype.decode = function(srcBuffer, onMessage) {
    let binary = this._binary;
    let srcPos = 0;
    while (srcPos < srcBuffer.length) {
        let srcRemain = srcBuffer.length - srcPos;
        let bytesRead = 0;
        switch (this._decodeState) {
            case DECODE_STATE_INITIAL:
                let preamble = srcBuffer.readUInt8(srcPos);
                bytesRead = 1;
                if (PREAMBLE !== preamble) throw new Error("preamble did not match: expected " + PREAMBLE + ", was " + preamble);
                this._decodeState = DECODE_STATE_READ_LENGTH;
                break;
            case DECODE_STATE_READ_LENGTH:
                let byte = srcBuffer.readUInt8(srcPos);
                bytesRead = 1;
                if (PREAMBLE !== byte) {
                    this._lengthBuf.push(byte);
                } else {
                    let messageLength = parseInt(Buffer.from(this._lengthBuf).toString());
                    if (messageLength) {
                        this._decodeBuffer = new Buffer(messageLength);
                        this._decodeBuffer.fill(0);
                        this._decodeBufferPos = 0;
                        this._decodeState = DECODE_STATE_READ_DATA;
                    } else {
                        // Empty message...
                        messageComplete(new Buffer(0));
                        this._decodeState = DECODE_STATE_INITIAL;
                    }
                    this._lengthBuf = [];
                }
                break;
            case DECODE_STATE_READ_DATA:
                bytesRead = Math.min(srcRemain, this._decodeBuffer.length - this._decodeBufferPos);
                srcBuffer.copy(this._decodeBuffer, this._decodeBufferPos, srcPos, srcPos + bytesRead);
                this._decodeBufferPos += bytesRead;
                if (this._decodeBufferPos >= this._decodeBuffer.length) {
                    messageComplete(this._decodeBuffer);
                    this._decodeState = DECODE_STATE_INITIAL;
                    this._decodeBuffer = undefined;
                }
                break
        }
        if (!bytesRead) throw new Error("unexpected: bytesRead == 0");
        srcPos += bytesRead;
    }

    function messageComplete(buffer) {
        onMessage(binary ? buffer : buffer.toString());
    }
};