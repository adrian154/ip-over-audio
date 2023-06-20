// code for creating RRC filter
(data => {
    try {
        module.exports = data;
    } catch(err) {
        window.RRC = data;
    }
})(QAM => {

    const filter = new Array(64);
    for(let i = 0; i < filter.length; i++) {
        const t = (i - filter.length / 2) / QAM.SYMBOL_LEN;
        const undef = QAM.SYMBOL_LEN / (4 * QAM.ROLLOFF);
        if(i == filter.length / 2)
            filter[i] = (1 - QAM.ROLLOFF) + 4 * QAM.ROLLOFF / Math.PI;
        else if(i == filter.length / 2 + undef || i == filter.length / 2 - undef)
            filter[i] = QAM.ROLLOFF / Math.sqrt(2) * ((1 + 2 / Math.PI) * Math.sin(Math.PI / 4 / QAM.ROLLOFF) + (1 - 2 / Math.PI) * Math.cos(Math.PI / 4 / QAM.ROLLOFF));
        else
            filter[i] = (Math.sin(Math.PI * t * (1 - QAM.ROLLOFF)) + 4 * QAM.ROLLOFF * t * Math.cos(Math.PI * t * (1 + QAM.ROLLOFF))) / (Math.PI * t * (1 - (4 * QAM.ROLLOFF * t)**2)); 
    }

    // scale kernel so maximum = 1
    const max = filter.reduce((a,c) => Math.max(a,c), 0);
    for(let i = 0; i < filter.length; i++) filter[i] *= 1 / max;

    return filter;

});