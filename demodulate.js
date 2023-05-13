const p = document.getElementById("settings");
const symbolRate = QAM.SAMPLE_RATE / QAM.SYMBOL_LEN
p.textContent = `sample rate = ${QAM.SAMPLE_RATE} Hz, carrier = ${QAM.CARRIER_FREQ} Hz, symbol length = ${QAM.SYMBOL_LEN} samples / symbol rate = ${symbolRate} baud, data rate = ${symbolRate * 2} kbit/s`;

const PI2 = 2 * Math.PI;

// compute low pass filter kernel
const createFilter = () => {

    const filter = new Array(100);
    
    const CUTOFF = QAM.CARRIER_FREQ / QAM.SAMPLE_RATE;
    for(let i = 0; i < filter.length; i++) {   
        // use Hamming window to reduce ringing
        const window = 0.54 - 0.46 * Math.cos(PI2 * i / filter.length);
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

    return filter;

};

const filter = createFilter();

const drawWaveforms = (I, Q) => {

    const canvas = document.getElementById("waveform"),
          ctx = canvas.getContext("2d", {alpha: false});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const plotWave = (signal, x, y, width, height) => {

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

        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        for(let i = 0; i < width; i++) {
            const pointY = y + height - (signal[i] + 1) / 2 * height;
            if(i == 0)
                ctx.moveTo(x + i, pointY);
            else
                ctx.lineTo(x + i, pointY);
        }
        ctx.stroke();

    };

    const h = (canvas.height - 20) / 2;
    plotWave(I, 10, 10, canvas.width - 20, h);
    plotWave(Q, 10, 10 + h, canvas.width - 20, h);

};

const drawConstellation = (I, Q) => {

    const canvas = document.getElementById("iq"),
          ctx = canvas.getContext("2d", {alpha: true});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 255, 25%)";
    for(let i = QAM.SYMBOL_LEN / 2; i < I.length; i += QAM.SYMBOL_LEN) {
        ctx.beginPath()
        ctx.arc(canvas.width * (I[i] + 1) / 2, canvas.height * (Q[i] + 1) / 2, 2, 0, PI2);
        ctx.fill();
    }

};

const drawEyePattern = (I, Q) => {

    const canvas = document.getElementById("eye"),
          ctx = canvas.getContext("2d", {alpha: false});

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const windowLen = 3 * QAM.SYMBOL_LEN;
    ctx.strokeStyle = "rgba(0, 0, 0, 10%)";
    for(let i = QAM.SYMBOL_LEN / 2; i < I.length; i += QAM.SYMBOL_LEN) {
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

};

let phaseAdjust = 0;
let signal = null;

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
    
    for(const [signal, filtered] of [[unfilteredI, filteredI], [unfilteredQ, filteredQ]]) {
        for(let i = filter.length; i < signal.length; i++) {
            let x = 0;
            for(let j = 0; j < filter.length; j++) {
                x += signal[i - j] * filter[j];
            }
            filtered[i - filter.length / 2] = x;
        }
    }

    // draw waveforms
    drawWaveforms(filteredI, filteredQ);

    // draw constellation diagram
    drawConstellation(filteredI, filteredQ);

    // draw eye pattern
    drawEyePattern(filteredI, filteredQ);

};

document.getElementById("file").addEventListener("input", event => {
    
    const reader = new FileReader();
    reader.readAsArrayBuffer(event.target.files[0]);
    reader.onload = () => {
        signal = new Float32Array(reader.result);
        demodulate();
    };

});