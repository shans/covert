
function asString(input, name, defaultValue) {
  var r = input.get('--' + name);
  return r ? r.cssString.trim() : defaultValue;
}

function asNumber(input, name, defaultValue) {
  var r = input.get('--' + name);
  return r ? Number(r.cssString) : defaultValue;
}

function asNumberOrPercent(input, name, defaultValue) {
  var r = input.get('--' + name);
  if (r == null)
    return defaultValue;
  r = r.cssString;
  if (!isNaN(Number(r)))
    return {type: "number", value: Number(r)};
  return {type: "percent", value: Number(r.split("%")[0])};
}

function resolveNumberOrPercent(input, name, size) {
  var r = asNumberOrPercent(input, name, {type: "number", value: 0});
  if (r.type == "number")
    return r.value;
  return r.value / 100 * size;
}

function prepareFill(ctx, inputs) {
  var fill = false;
  var stroke = false;
  if (inputs.get('--fill') != null) {
    ctx.fillStyle = asString(inputs, 'fill', 'black');
    fill = true;
  }
  var texture = asString(inputs, 'texture', undefined);
  var melt = undefined;
  if (texture && texture.substring(0, 5) == 'melt ') {
    melt = texture.substring(5);
    texture = undefined;
    console.log(melt);
  }
  ctx.shadowColor = asString(inputs, 'shadow-color', '');
  ctx.shadowBlur = asNumber(inputs, 'shadow-blur', 0);
  ctx.shadowOffsetX = asNumber(inputs, 'shadow-offset-x', 0);
  ctx.shadowOffsetY = asNumber(inputs, 'shadow-offset-y', 0);
  if (inputs.get('--stroke') != null) {
    ctx.strokeStyle = asString(inputs, 'stroke', 'black');
    ctx.lineWidth = asNumber(inputs, 'line-width', 1);
    stroke = true;
  }
  return {fill: fill, stroke: stroke, texture: texture, melt: melt};
}

function resetShadow(ctx) {
  ctx.shadowColor = 'transparent';
}

function getParamsRect(ctx, geom, inputs) {
  var left = resolveNumberOrPercent(inputs, 'left', geom.width);
  var top = resolveNumberOrPercent(inputs, 'top', geom.height);
  var width = resolveNumberOrPercent(inputs, 'width', geom.width);
  var height = resolveNumberOrPercent(inputs, 'height', geom.height);
  return {left: left, top: top, width: width, height: height};
}

function fillRect(ctx, params) {
  ctx.fillRect(params.left, params.top, params.width, params.height);
}

function strokeRect(ctx, params) {
  ctx.strokeRect(params.left, params.top, params.width, params.height);
}

function clipRect(ctx, params) {
  ctx.clip(new Path2D(`M ${params.left} ${params.top} l ${params.width} 0 l 0 ${params.height} l -${params.width} 0 z`));
}

function melt(ctx, geom, melt, fill, stroke) {
  ctx.shadowBlur = 60;
  ctx.shadowColor = 'black';
  ctx.fillStyle = 'black';
  ctx.globalCompositeOperation = 'source-over';
  texture(ctx, geom, melt);
  ctx.shadowBlur = 0;
  
  ctx.globalCompositeOperation = 'xor';
  ctx.fillStyle = 'black';
  fill();

  ctx.globalCompositeOperation = 'destination-atop';
  ctx.fillStyle = 'white';
  fill();

  ctx.globalCompositeOperation = 'color-dodge';
  ctx.fillStyle = 'rgba(210,210,210,1)';
  fill();

  ctx.globalCompositeOperation = 'color-burn';
  console.log(ctx.globalCompositeOperation);
  ctx.fillStyle = 'rgba(30,30,30,1);'
  fill();
  fill();
  fill();
  fill();
  fill();
  fill();
}

function texture(ctx, geom, texture) {
  var parts = texture.split("|");
  for (var part of parts) {
    var cmds = part.split("^");
    var draw = (() => undefined);
    var fillInfo = { stroke: false, fill: false};
    ctx.save();
    ctx.beginPath();
    for (var cmd of cmds) {
      bits = cmd.split(' ').filter(a => a.trim() != '');
      switch (bits[0]) {
        case 'circle':
          draw = (bits => function() {
            ctx.ellipse(Number(bits[1]), Number(bits[2]), Number(bits[3]), Number(bits[3]), 0, 0, 2 * Math.PI);
            doPaint(ctx, geom, fillInfo, null, a => a.fill(), a => a.stroke());
          })(bits);
          break;
        case 'rect':
          draw = (bits => function() {
            doPaint(ctx, geom, fillInfo, {left: Number(bits[1]), top: Number(bits[2]), width: Number(bits[3]), height: Number(bits[4])}, fillRect, strokeRect);
          })(bits);
          break;
        case 'shape':
          draw = (bits => function() {
            path = bits.slice(1).join(' ');
            doPaint(ctx, geom, fillInfo, new Path2D(path), (a,b) => a.fill(b), (a,b) => a.stroke(b));
          })(bits);
          break;
        case 'fill':
          fillInfo.fill = true;
          ctx.fillStyle = bits[1];
          break;
        case 'stroke':
          fillInfo.stroke = true;
          ctx.strokeStyle = bits[1];
          ctx.lineWidth = bits[2];
          break;
        case 'shadow':
          ctx.shadowColor = bits[1];
          ctx.shadowBlur = Number(bits[2]);
          ctx.shadowOffsetX = Number(bits[3]);
          ctx.shadowOffsetY = Number(bits[4]);
          break;
      }
    }
    draw();
    ctx.restore();
  }
}

function getParamsCircle(ctx, geom, inputs) {
  var left = resolveNumberOrPercent(inputs, 'center-left', geom.width);
  var top = resolveNumberOrPercent(inputs, 'center-top', geom.height);
  var radius = resolveNumberOrPercent(inputs, 'radius', Math.sqrt(geom.width * geom.width + geom.height * geom.height));
  return (() => ctx.ellipse(left, top, radius, radius, 0, 0, 2 * Math.PI));
}

function paint(ctx, geom, inputs, getParams, fill, stroke, clip, texture, melt) {
  var fillInfo = prepareFill(ctx, inputs);
  var params = getParams(ctx, geom, inputs);
  doPaint(ctx, geom, fillInfo, params, fill, stroke, clip, texture, melt);
}

function doPaint(ctx, geom, fillInfo, params, fill, stroke, clip, texture, melt) {
  if (fillInfo.fill) fill(ctx, params);
  if (fillInfo.texture) {
    ctx.save();
    clip(ctx, params);
    texture(ctx, geom, fillInfo.texture);
    ctx.restore();
  }
  if (fillInfo.melt) {
    ctx.save();
    clip(ctx, params);
    melt(ctx, geom, fillInfo.melt, () => fill(ctx, params));
  }
  if (fillInfo.fill && fillInfo.stroke) resetShadow(ctx);
  if (fillInfo.stroke) stroke(ctx, params);
}

registerPaint("rect", class {
  paint(ctx, geom, inputs) {
    paint(ctx, geom, inputs, getParamsRect, fillRect, strokeRect, clipRect, texture, melt);
  }
});

registerPaint("circle", class {
  paint(ctx, geom, inputs) {
    paint(ctx, geom, inputs, getParamsCircle, (a,b) => b() || a.fill(), (a, b) => b() || a.stroke(), (a,b) => b() || a.clip(), texture, melt);
  }
});

registerPaint("shape", class {
  paint(ctx, geom, inputs) {
    paint(ctx, geom, inputs, (a, b, c) => new Path2D(asString(c, 'path')), (a, b) => a.fill(b), (a, b) => a.stroke(b), (a, b) => a.clip(b), texture, melt);
  }
});
