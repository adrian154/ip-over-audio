const p = document.getElementById("settings");
const symbolRate = QAM.SAMPLE_RATE / QAM.SYMBOL_LEN,
      bitsPerSymbol = QAM.MODE === "256-QAM" ? 8 :
                      QAM.MODE === "64-QAM" ? 6 :
                      QAM.MODE === "16-QAM" ? 4 :
                                              2;
p.textContent = `sample rate = ${QAM.SAMPLE_RATE} Hz, carrier = ${QAM.CARRIER_FREQ} Hz, symbol length = ${QAM.SYMBOL_LEN} samples, symbol rate = ${symbolRate} baud, data rate = ${symbolRate * bitsPerSymbol} kbit/s`;

const PI2 = 2 * Math.PI;

// compute low pass filter kernel
const createLowpassFilter = () => {

    const filter = new Array(64);
    
    const CUTOFF = QAM.CARRIER_FREQ / QAM.SAMPLE_RATE;

    for(let i = 0; i < filter.length; i++) {   
        // use Hamming window to reduce ringing
        const window = 0.54 - 0.46 * Math.cos(PI2 * i / filter.length);
        if(i == filter.length / 2)
            filter[i] = PI2 * CUTOFF * window;
        else
            filter[i] = Math.sin(PI2 * CUTOFF * (i - filter.length / 2)) / (i - filter.length / 2) * window;
    }

    return filter;

};


const createFilter = () => {

    const lowpass = createLowpassFilter(),
          rrc = RRC(QAM)

    const filter = new Array(lowpass.length + rrc.length).fill(0);
    for(let i = 0; i < lowpass.length; i++) {
        for(let j = 0; j < rrc.length; j++) {
            filter[i + j] += lowpass[i] * rrc[j];
        }
    }

    let sum = 0;
    for(const x of filter) {
        sum += x;
    }

    for(let i = 0; i < filter.length; i++) {
        filter[i] /= sum;
    }

    return filter;


    return filter;

};

const filter = createFilter();

const drawWaveforms = (I, Q) => {

    const canvas = document.getElementById("waveform"),
          ctx = canvas.getContext("2d", {alpha: false});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plotWave = (signal, x, y, width, height, color) => {

        // draw boundary lines
        ctx.strokeStyle = "rgba(0, 0, 0, 25%)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width, y + height / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height)
        ctx.stroke();

        ctx.strokeStyle = color;
        ctx.beginPath();
        for(let i = 0; i < width / 2; i++) {
            const pointY = y + height - (signal[i * 2] + 1) / 2 * height;
            if(i == 0)
                ctx.moveTo(x + i * 2, pointY);
            else
                ctx.lineTo(x + i * 2, pointY);
        }
        ctx.stroke();

    };

    const h = (canvas.height - 20) / 2;
    plotWave(I, 10, 10, canvas.width - 20, h, "#ff0000");
    plotWave(Q, 10, 10 + h, canvas.width - 20, h, "#0000ff");

};

const drawSpectrum = (signal) => {

    const canvas = document.getElementById("spectrum"),
          ctx = canvas.getContext("2d", {alpha: false});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spd = new Array(canvas.width);
    const WL = 1024;
    for(let x = 1; x < canvas.width; x++) {
        
        const freq = x / canvas.width * (QAM.SAMPLE_RATE / 2);
        let Re = 0, Im = 0;
        for(let i = 0; i < WL; i++) {
            const t = i / QAM.SAMPLE_RATE;
            Re += Math.sin(2*Math.PI*t*freq)*signal[i];
            Im += Math.cos(2*Math.PI*t*freq)*signal[i];
        }
        spd[x] = Math.log(Re**2 + Im**2);
        //spd[x] = Re**2+Im**2;
    }

    const max = spd.reduce((a,c) => Math.max(a, c), -Infinity),
          min = spd.reduce((a,c) => Math.min(a, c), Infinity);

    ctx.beginPath();
    for(let x = 0; x < canvas.width; x++) {
        const y = canvas.height - ((spd[x]-min)/(max-min)*(canvas.height-20));
        if(x == 0)
            ctx.moveTo(x, y);
        else
            ctx.lineTo(x, y);
    }
    ctx.stroke();

};

const drawConstellation = (I, Q) => {

    const canvas = document.getElementById("iq"),
          ctx = canvas.getContext("2d", {alpha: true});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff00";
    for(let i = offset; i < I.length; i += QAM.SYMBOL_LEN) {
        ctx.beginPath()
        ctx.arc(canvas.width * (I[i] + 1) / 2, canvas.height * (Q[i] + 1) / 2, 1, 0, PI2);
        ctx.fill();
    }

};

const drawEyePattern = (I, Q) => {

    const canvas = document.getElementById("eye"),
          ctx = canvas.getContext("2d", {alpha: false});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const windowLen = 2 * QAM.SYMBOL_LEN;
    
    ctx.strokeStyle = "rgba(255, 0, 0, 5%)";
    for(let i = offset; i < I.length; i += QAM.SYMBOL_LEN) {
        ctx.beginPath();
        for(let j = 0; j <= windowLen; j++) {
            const y = canvas.height * (I[i + j] + 1) / 2;
            if(j == 0)
                ctx.moveTo(j / windowLen * canvas.width, y);
            else
                ctx.lineTo(j / windowLen * canvas.width, y);
        }
        ctx.stroke();
    }

    ctx.strokeStyle = "rgba(0, 0, 255, 5%)";
    for(let i = offset; i < Q.length; i += QAM.SYMBOL_LEN) {
        ctx.beginPath();
        for(let j = 0; j <= windowLen; j++) {
            const y = canvas.height * (Q[i + j] + 1) / 2;
            if(j == 0)
                ctx.moveTo(j / windowLen * canvas.width, y);
            else
                ctx.lineTo(j / windowLen * canvas.width, y);
        }
        ctx.stroke();
    }

};

let phaseAdjust = 0;
let signal = null;
let offset = Math.floor(QAM.SYMBOL_LEN / 2);

const demodulate = () => {

    // extract I and Q
    const unfilteredI = new Float32Array(signal.length),
          unfilteredQ = new Float32Array(signal.length);

    for(let i = 0; i < signal.length; i++) {
        const t = i / QAM.SAMPLE_RATE;
        unfilteredI[i] = signal[i] * Math.sin(PI2 * QAM.CARRIER_FREQ * t + phaseAdjust);
        unfilteredQ[i] = signal[i] * Math.cos(PI2 * QAM.CARRIER_FREQ * t + phaseAdjust);
    }

    // filter I and Q to remove high-frequency components
    const filteredI = new Float32Array(signal.length),
          filteredQ = new Float32Array(signal.length);

    for(let i = filter.length; i < signal.length; i++) {

        let ix = 0, qx = 0;
        for(let j = 0; j < filter.length; j++) {
            ix += unfilteredI[i - j] * filter[j];
            qx += unfilteredQ[i - j] * filter[j];
        }

        filteredI[i] = ix * 2;
        filteredQ[i] = qx * 2;

    }

    drawWaveforms(filteredI, filteredQ);
    drawConstellation(filteredI, filteredQ);
    drawEyePattern(filteredI, filteredQ);
    drawSpectrum(signal);

};

document.getElementById("file").addEventListener("input", event => {
    
    const reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);
    reader.onload = () => {
        signal = new Float32Array(reader.result);
        document.getElementById("signalinfo").textContent = `signal length = ${signal.length} samples / ${signal.length / QAM.SAMPLE_RATE} seconds`
        demodulate();
    };

});