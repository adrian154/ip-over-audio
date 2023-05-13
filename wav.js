// minimal WAV encoder for js
const {BufferBuilder} = require("bufferpants");
const fs = require("fs");

module.exports = (filename, pcm, sampleRate) => {

    // chunk ID
    const buf = new BufferBuilder();
    buf.writeBuffer(Buffer.from("RIFF"));

    // size of file except this field
    const size = 36 + pcm.length * 2;
    buf.writeUInt32LE(size);

    // format
    buf.writeBuffer(Buffer.from("WAVE"));

    // subchunk ID
    buf.writeBuffer(Buffer.from("fmt "));

    // subchunk size
    buf.writeUInt32LE(16);

    // audio format (1 for linear PCM)
    buf.writeUInt16LE(1);

    // # of channels (1)
    buf.writeUInt16LE(1);

    // sample rate
    buf.writeUInt32LE(sampleRate);

    // byte rate
    buf.writeUInt32LE(sampleRate * 2);

    // block align
    buf.writeUInt16LE(2);

    // bits per sample
    buf.writeUInt16LE(16);

    // subchunk 2: data
    buf.writeBuffer(Buffer.from("data"));

    // sample count
    buf.writeUInt32LE(pcm.length * 2);

    for(const sample of pcm) {
        try {
            buf.writeInt16LE(Math.trunc(sample * 32767));
        } catch(err) {
            console.log("bad value: " + sample);
            throw err;
        }
    }

    fs.writeFileSync(filename, buf.build());

};