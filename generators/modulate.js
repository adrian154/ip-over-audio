const QAM = require("../settings.js");
const rrc = require("../rrc.js")(QAM);
const writeWav = require("./wav.js");
const fs = require("fs");

const PI2 = 2 * Math.PI;
/*
// create raised-cosine pulse
const sinc = x => Math.sin(Math.PI*x)/(Math.PI*x);
const pulse = new Array(64),
      ROLLOFF = 0.3;
for(let i = 0; i < pulse.length; i++) {
    const t = (i - pulse.length / 2);
    if(i == pulse.length / 2)
        pulse[i] = 1 / QAM.SYMBOL_LEN * Math.cos(Math.PI*ROLLOFF*t/QAM.SYMBOL_LEN) / (1 - (2*ROLLOFF*t/QAM.SYMBOL_LEN)**2)
    else
        pulse[i] = 1 / QAM.SYMBOL_LEN * sinc(t / QAM.SYMBOL_LEN) * Math.cos(Math.PI*ROLLOFF*t/QAM.SYMBOL_LEN) / (1 - (2*ROLLOFF*t/QAM.SYMBOL_LEN)**2)
}

for(let i = 0; i < pulse.length; i++) pulse[i]*=4;

console.log("PULSE:");
console.log(pulse.join("\n"));
console.log("RRC:");
console.log(rrc.join("\n"));
*/

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
} else if(QAM.MODE === "256-QAM") {
    for(const byte of bytes) {
        symbols.push(byte);
    }
}

// generate pulse-shaped baseband
const basebandI = new Float32Array(symbols.length * QAM.SYMBOL_LEN),
      basebandQ = new Float32Array(symbols.length * QAM.SYMBOL_LEN);

const signal = new Float32Array(symbols.length * QAM.SYMBOL_LEN);

for(let i = 0; i < symbols.length; i++) {

    const symbol = symbols[i];
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
    } else if(QAM.MODE === "256-QAM") {
        I = [-1, -13/15, -11/15, -9/15, -7/15, -5/15, -3/15, -1/15, 1/15, 3/15, 5/15, 7/15, 9/15, 11/15, 13/15, 1][symbol & 0b1111];
        Q = [-1, -13/15, -11/15, -9/15, -7/15, -5/15, -3/15, -1/15, 1/15, 3/15, 5/15, 7/15, 9/15, 11/15, 13/15, 1][(symbol >> 4)&0b1111];
    }

    // add pulse    
    for(let j = 0; j < rrc.length; j++) {
        basebandI[i * QAM.SYMBOL_LEN + j] += rrc[j] * I;
        basebandQ[i * QAM.SYMBOL_LEN + j] += rrc[j] * Q;
    }

}

for(let i = 0; i < signal.length; i++) {
    const t = i / QAM.SAMPLE_RATE;
    signal[i] = (Math.sin(PI2 * QAM.CARRIER_FREQ * t) * basebandI[i] + Math.cos(PI2 * QAM.CARRIER_FREQ * t) * basebandQ[i]) / 2;
}

// write signal
fs.writeFileSync("signals/basebandI.raw", Buffer.from(basebandI.buffer));
fs.writeFileSync("signals/modulated.raw", Buffer.from(signal.buffer));
writeWav("signals/modulated.wav", [signal], QAM.SAMPLE_RATE);
writeWav("signals/baseband.wav", [basebandI, basebandQ], QAM.SAMPLE_RATE);