const QAM = require("./settings.js");
const writeWav = require("./wav.js");
const fs = require("fs");

const PI2 = 2 * Math.PI;

// read bytes
const bytes = fs.readFileSync(process.argv[2]);

// convert data to symbols
const symbols = [];
for(const byte of bytes) {
    if(QAM.MODE === "4-QAM") {
        symbols.push(byte & 0b11, (byte >> 2) & 0b11, (byte >> 4) & 0b11, (byte >> 6) & 0b11);
    } else if(QAM.MODE === "16-QAM") {
        symbols.push(byte & 0b1111, (byte >> 4) & 0b1111);
    }
}

// generate signal
const signal = new Float32Array(symbols.length * QAM.SYMBOL_LEN);
for(let i = 0; i < signal.length; i++) {

    // determine I/Q component
    const symbol = symbols[Math.floor(i / QAM.SYMBOL_LEN)];

    let I = 0, Q = 0;
    if(QAM.MODE === "4-QAM") {
        I = [-1, 1][symbol & 0b1];
        Q = [-1, 1][symbol & 0b10];
    } else if(QAM.MODE === "16-QAM") {
        I = [-1, -1/3, 1/3, 1][symbol & 0b11];
        Q = [-1, -1/3, 1/3, 1][(symbol >> 2) & 0b11];
    }

    const t = i / QAM.SAMPLE_RATE;
    signal[i] = (Math.sin(PI2 * QAM.CARRIER_FREQ * t) * I + Math.cos(PI2 * QAM.CARRIER_FREQ * t) * Q) / 2;

}

// write signal
writeWav("signal.wav", signal, QAM.SAMPLE_RATE);