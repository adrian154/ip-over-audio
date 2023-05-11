const PI2 = 2 * Math.PI;

const SAMPLE_RATE = 48000;
const CARRIER_FREQ = 12000;
const SYMBOL_RATE = 5000;

const I = new Array(SAMPLE_RATE),
      Q = new Array(SAMPLE_RATE);

const data = "The quick brown fox jumps over the lazy dog".split("").map(char => char.charCodeAt(0));

const SYMBOL_LEN = SAMPLE_RATE / SYMBOL_RATE;
for(let i = 0; i < SAMPLE_RATE; i++) {
    const symbolIdx = Math.floor(i / SYMBOL_LEN);
    const byte = data[Math.floor(symbolIdx / 4)] || 0;
    const symbol = (byte >> (symbolIdx % 4)) & 0b11;
    I[i] = (symbol & 0b1) ? -1 : 1;
    Q[i] = (symbol & 0b10) ? -1 : 1;
}

const signal = new Array(SAMPLE_RATE);

// modulate
for(let sample = 0; sample < signal.length; sample++) {

    const t = sample / SAMPLE_RATE;
    
    signal[sample] = Math.sin(PI2 * CARRIER_FREQ * t) * I[sample] +
                     Math.cos(PI2 * CARRIER_FREQ * t) * Q[sample] +
                     Math.random() * 0.1;

}

const productI = new Array(signal.length).fill(0),
      productQ = new Array(signal.length).fill(0);

const recoveredI = new Array(signal.length).fill(0),
      recoveredQ = new Array(signal.length).fill(0);

const PHASE_ERROR = 0;

// multiply signal by carriers
// the resulting signals contain I/Q as well as unwanted high-frequency components at 2f_c
for(let sample = 0; sample < signal.length; sample++) {
    const t = sample / SAMPLE_RATE;
    productI[sample] = signal[sample] * Math.sin(PI2 * CARRIER_FREQ * t + PHASE_ERROR);
    productQ[sample] = signal[sample] * Math.cos(PI2 * CARRIER_FREQ * t + PHASE_ERROR);
}

// compute low pass filter kernel
const filter = new Array(100);
const CUTOFF = CARRIER_FREQ / SAMPLE_RATE;
for(let i = 0; i < filter.length; i++) {   
    //const window = 0.42 - 0.5 * Math.cos(PI2 * i / filter.length) + 0.08 * Math.cos(PI2 * 2 * i / filter.length);
    // use Hamming window to reduce ringing
    //const window = 0.54 - 0.46 * Math.cos(PI2 * i / filter.length);
    const window = 1;
    if(i == filter.length / 2)
        filter[i] = PI2 * CUTOFF * window;
    else
        filter[i] = Math.sin(PI2 * CUTOFF * (i - filter.length / 2)) / (i - filter.length / 2) * window;
}

// normalize kernel
let sum = 0;
for(const x of filter) {
    sum += x;
}

for(let i = 0; i < filter.length; i++) {
    filter[i] /= sum;
}

// convolve signals with filter kernels
for(const signal of [productI, productQ]) {
    const dest = signal === productI ? recoveredI : recoveredQ;
    for(let i = filter.length; i < signal.length; i++) {
        let x = 0;
        for(let j = 0; j < filter.length; j++) {
            x += signal[i - j] * filter[j];
        }
        dest[i] = x;
    }
}

const canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d", {alpha: false});

ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const plot = (arr, y, color, title) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    for(let i = 0; i < canvas.width; i++) {
        const h = arr[i] * 30 + 50;
        if(i == 0)
            ctx.moveTo(i, y - h);
        else
            ctx.lineTo(i, y - h);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 0, 75%)";
    ctx.fillText(title, 2, y - 94);
};

plot(I, 100, "#ff0000", "in-phase component");
plot(Q, 200, "#ff0000", "quadrature component");
plot(signal, 300, "#ff0000", "modulated signal");
plot(productI, 400, "#ff0000", "demodulated I");
plot(productQ, 500, "#ff0000", "demodulated Q");
plot(recoveredI, 600, "#ff0000", "filtered I");
plot(recoveredQ, 700, "#ff0000", "filtered Q");

const constellation = document.getElementById("constellation-diagram"),
      constellationCtx = constellation.getContext("2d");

constellationCtx.fillStyle = "#ffffff";
constellationCtx.fillRect(0, 0, constellation.width, constellation.height);
constellationCtx.fillStyle = "rgba(0, 0, 0, 10%)";
for(let i = 0; i < signal.length; i++) {
    constellationCtx.fillRect(
        constellation.width * (recoveredI[i] + 1) / 2,
        constellation.height * (recoveredQ[i] + 1) / 2,
        1, 1
    );
}