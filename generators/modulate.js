const QAM = require("../settings.js");
const writeWav = require("./wav.js");
const fs = require("fs");

const PI2 = 2 * Math.PI;

// read bytes
const bytes = fs.readFileSync(process.argv[2]);

// convert data to symbols
const symbols = [];
if(QAM.MODE === "4-QAM") {
    for(const byte of bytes) {
        symbols.push(byte & 0b11, (byte >> 2) & 0b11, (byte >> 4) & 0b11, (byte >> 6) & 0b11);
    }
} else if(QAM.MODE === "16-QAM") {
    for(const byte of bytes) {
        symbols.push(byte & 0b1111, (byte >> 4) & 0b1111);
    }
} else if(QAM.MODE === "64-QAM") {
    for(let i = 0; i < bytes.length; i += 3) {
        const word = bytes[i] | ((bytes[i + 1]||0) << 8) | ((bytes[i + 2]||0) << 16);
        symbols.push(word & 0b111111, (word>>6) & 0b111111, (word>>12) & 0b111111, (word>>18) & 0b111111);
    }
}


// generate signal
const signal = new Float32Array(symbols.length * QAM.SYMBOL_LEN);
const basebandI = new Float32Array(symbols.length * QAM.SYMBOL_LEN),
      basebandQ = new Float32Array(symbols.length * QAM.SYMBOL_LEN);

for(let i = 0; i < signal.length; i++) {

    // determine I/Q component
    const symbol = symbols[Math.floor(i / QAM.SYMBOL_LEN)];

    let I = 0, Q = 0;
    if(QAM.MODE === "4-QAM") {
        I = [-1, 1][symbol & 0b1];
        Q = [-1, 1][(symbol & 0b10) >> 1];
    } else if(QAM.MODE === "16-QAM") {
        I = [-1, -1/3, 1/3, 1][symbol & 0b11];
        Q = [-1, -1/3, 1/3, 1][(symbol >> 2) & 0b11];
    } else if(QAM.MODE === "64-QAM") {
        I = [-1, -5/7, -3/7, -1/7, 1/7, 3/7, 5/7, 1][symbol & 0b111];
        Q = [-1, -5/7, -3/7, -1/7, 1/7, 3/7, 5/7, 1][(symbol >> 3) & 0b111]
    }

    basebandI[i] = I;
    basebandQ[i] = Q;

    const t = i / QAM.SAMPLE_RATE;
    signal[i] = (Math.sin(PI2 * QAM.CARRIER_FREQ * t) * I + Math.cos(PI2 * QAM.CARRIER_FREQ * t) * Q) / 2;
    if(isNaN(signal[i])) {
        throw new Error();
    }

}

// write signal
fs.writeFileSync("signals/basebandI.raw", Buffer.from(basebandI.buffer));
fs.writeFileSync("signals/modulated.raw", Buffer.from(signal.buffer));
writeWav("signals/modulated.wav", [signal], QAM.SAMPLE_RATE);
writeWav("signals/baseband.wav", [basebandI, basebandQ], QAM.SAMPLE_RATE);