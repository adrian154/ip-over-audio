const SAMPLE_RATE = 48000;
const writeWav = require("./wav.js");
const signal = new Float32Array(16384);
for(let i = 0; i < signal.length; i++) {
    const t = i / SAMPLE_RATE;
    signal[i] = Math.random() * 2 - 1; // noise
    //signal[i] = Math.sin(2 * Math.PI * t * 12000); // sine
    //signal[i] = Math.sign(Math.sin(2 * Math.PI * t * 8000)); // square 
}
require("fs").writeFileSync("signals/generated.raw", Buffer.from(signal.buffer));
writeWav("signals/generated.wav", [signal], SAMPLE_RATE);