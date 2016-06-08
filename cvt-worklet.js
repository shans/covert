
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
  ctx.fillStyle = asString(inputs, 'fill', 'black');
  ctx.shadowColor = asString(inputs, 'shadow-color', '');
  ctx.shadowBlur = asNumber(inputs, 'shadow-blur', 0);
  ctx.shadowOffsetX = asNumber(inputs, 'shadow-offset-x', 0);
  ctx.shadowOffsetY = asNumber(inputs, 'shadow-offset-y', 0);
}

registerPaint("rect", class {
  static get inputProperties() { return ["--fill"]; }
  paint(ctx, geom, inputs) {
    prepareFill(ctx, inputs);
    var left = resolveNumberOrPercent(inputs, 'left', geom.width);
    var top = resolveNumberOrPercent(inputs, 'top', geom.height);
    var width = resolveNumberOrPercent(inputs, 'width', geom.width);
    var height = Math.floor(resolveNumberOrPercent(inputs, 'height', geom.height));
    ctx.fillRect(left, top, width, height);
  }
});

registerPaint("circle", class {
  static get inputProperties() { return ["--fill"]; }
  paint(ctx, geom, inputs) {
    prepareFill(ctx, inputs);
    var left = resolveNumberOrPercent(inputs, 'center-left', geom.width);
    var top = resolveNumberOrPercent(inputs, 'center-top', geom.height);
    var radius = resolveNumberOrPercent(inputs, 'radius', Math.sqrt(geom.width * geom.width + geom.height * geom.height));
    ctx.ellipse(left, top, radius, radius, 0, 0, 2 * Math.PI);
    ctx.fill()
  }
});
