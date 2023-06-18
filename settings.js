// ridiculously jank but whatever
(data => {
    try {
        module.exports = data;
    } catch(err) {
        window.QAM = data;
    }
})({
    SAMPLE_RATE: 48000,
    CARRIER_FREQ: 12000,
    SYMBOL_LEN: 4,
    MODE: "64-QAM"
});