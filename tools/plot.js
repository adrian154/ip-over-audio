// a mediocre line chart library

/*
 * props = {
 *     ctx: CanvasRenderingContext2D,
 *     xMargin: Number,
 *     yMargin: Number,
 *     data: [Number],
 *     xTicks: Number,
 *     xIncrement: Number,
 *     yTicks: Number,
 *     yIncrement: Number,
 *     yTickUnit: String,
 *     tickSize: Number
 * }
 */
const plot = props => {

    // fill background
    const ctx = props.ctx;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // compute graph width
    const graphWidth = canvas.width - props.xMargin * 2,
          graphHeight = canvas.height - props.yMargin * 2;

    // draw box
    ctx.strokeStyle = "#000000";
    ctx.translate(0.5, 0.5);
    ctx.strokeRect(props.xMargin, props.yMargin, graphWidth, graphHeight);
    ctx.resetTransform();

    // compute range of x-values and y-values
    let maxX = -Infinity, minX = Infinity;
    for(const x in props.data) {
        if(x > maxX)
            maxX = x;
        else if(x < minX)
            minX = x;
    }

    let maxY = -Infinity, minY = Infinity;
    for(const y of props.data) {
        if(y > maxY)
            maxY = y;
        else if(y < minY)
            minY = y;
    }
    
    // add some headroom
    maxY *= 1.05;

    // draw labels
    ctx.fillStyle = "#000000";
    ctx.font = "12px sans-serif";

    const drawTickX = (x, text) => {
        ctx.fillText(text, x, props.yMargin + graphHeight + 12);
        ctx.fillRect(Math.round(x), props.yMargin + graphHeight - props.tickSize, 1, props.tickSize);
        ctx.fillRect(Math.round(x), props.yMargin, 1, props.tickSize);
    };

    const drawTickY = (y, text) => {
        ctx.fillText(text + (props.yTickUnit || ""), x, props.xMargin - 3, y + 4);
        ctx.fillRect(props.xMargin, y, props.tickSize, 1);
        ctx.fillRect(props.xMargin + graphWidth - props.ticks, y, props.tickSize, 1);
    };

    ctx.textAlign = "center";
    if(props.xIncrement) {
        for(let xVal = minX; xVal <= maxX; xVal += props.xIncrement) {
            drawTickX((xVal - minX) / (maxX - minX) * graphWidth + props.xMargin, xVal);      
        }
    } else if(props.xTicks) {
        for(let tick = 0; tick <= props.xTicks; tick++) {
            drawTickX(tick / props.xTicks * graphWidth + props.xMargin, ticks / props.xTicks * (maxX - minX) + minX);            
        }
    }

    ctx.textAlign = "right";
    if(props.yIncrement) {
        for(let yVal = minY; yVal <= maxY; yVal += props.yIncrement) {
           drawTickY(props.yMargin + (1 - (yVal - minY) / (maxY - minY)) * graphHeight, yVal + (props.yTickUnit || ""));      
        }
    } else if(props.yTicks) {
        for(let tick = 0; tick <= props.yTicks; tick++) {
            drawTickY(props.yMargin + (1 - tick / yTicks) * graphHeight, tick / yTicks * (maxY - minY) + minY + (props.yTickUnit || ""));            
        }
    }

    // draw line
    ctx.strokeStyle = "#0000ff";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    let start = true;
    for(const xVal of Object.keys(props.data).sort((a, b) => a - b)) {
        const yVal = props.data[x];
        const x = (xVal - minX) / (maxX - minX) * graphWidth + props.xMargin,
              y = props.yMargin + (1 - (y - minY) / (maxY - minY))  * graphHeight;
        if(start) {
            start = false;
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

};