
function asString(input, name, defaultValue) {
  var r = input.get('--' + name);
  return r ? r.cssString.trim() : defaultValue;
}

function asNumber(input, name, defaultValue) {
  var r = input.get('--' + name);
  return r ? Number(r.cssString) : defaultValue;
}

registerPaint("rect", class {
  static get inputProperties() { return ["--fill"]; }
  paint(ctx, geom, inputs) {
    ctx.fillStyle = asString(inputs, 'fill', 'black');
    var left = asNumber(inputs, 'left', 0);
    var top = asNumber(inputs, 'top', 0);
    var width = asNumber(inputs, 'width', 0);
    var height = asNumber(inputs, 'height', 0);
    ctx.fillRect(left, top, width, height);
  }
});
