// minimal WAV encoder for js
const {BufferBuilder} = require("bufferpants");
const fs = require("fs");

module.exports = (filename, channels, sampleRate) => {

    // chunk ID
    const buf = new BufferBuilder();
    buf.writeBuffer(Buffer.from("RIFF"));

    // size of file except this field
    const size = 36 + channels[0].length * 2;
    buf.writeUInt32LE(size);

    // format
    buf.writeBuffer(Buffer.from("WAVE"));

    // subchunk ID
    buf.writeBuffer(Buffer.from("fmt "));

    // subchunk size
    buf.writeUInt32LE(16);

    // audio format (1 for linear PCM)
    buf.writeUInt16LE(1);

    // # of channels
    buf.writeUInt16LE(channels.length);

    // sample rate
    buf.writeUInt32LE(sampleRate);

    // byte rate
    buf.writeUInt32LE(sampleRate * channels.length * 2);

    // block align
    buf.writeUInt16LE(channels.length * 2);

    // bits per sample
    buf.writeUInt16LE(16);

    // subchunk 2: data
    buf.writeBuffer(Buffer.from("data"));

    // sample count
    buf.writeUInt32LE(channels[0].length * 2);

    for(let i = 0; i < channels[0].length; i++) {
        for(const channel of channels) {
            try {
                buf.writeInt16LE(Math.trunc(channel[i] * 32767));
            } catch(err) {
                console.log("bad value: " + sample);
                throw err;
            }
        }
    }

    fs.writeFileSync(filename, buf.build());

};