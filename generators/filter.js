const fs = require("fs");
const data = fs.readFileSync(process.argv[2]);
const signal = new Float32Array(data.buffer);

const SAMPLE_RATE = 48000, CUTOFF_FREQ = 12000;
const PI2 = 2 * Math.PI;

const filter = new Array(64);    
const CUTOFF = CUTOFF_FREQ / SAMPLE_RATE;

for(let i = 0; i < filter.length; i++) {   
    // use Blackman window to reduce ringing
    const window = 0.42 - 0.5 * Math.cos(PI2 * i / filter.length) + 0.08 * Math.cos(4*Math.PI*i/filter.length);
    //const window = 0.54 - 0.46 * Math.cos(PI2 * i / filter.length);
    //const window = 1;
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

// convolve
const out = new Float32Array(signal.length);
for(let i = filter.length; i < signal.length; i++) {
    let x = 0;
    for(let j = 0; j < filter.length; j++) {
        x += signal[i-j]*filter[j];
    }
    out[i - filter.length / 2] = x;
}

fs.writeFileSync("signals/filtered.raw", Buffer.from(out.buffer));