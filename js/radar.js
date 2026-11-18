/* SVG 雷達圖：上、右、下、左 = 物件、空間、事件、人物；半徑 1 分在中心、5 分在外圈 */
(function (root) {
  var NS = 'http://www.w3.org/2000/svg', R = 105;
  var ANG = [-90, 0, 90, 180]; // 度
  function pt(i, v) { var r = R * (v - 1) / 4, a = ANG[i] * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  function el(n, attrs, text) { var e = document.createElementNS(NS, n); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }

  function draw(svg, scores, poles, mono) {
    svg.innerHTML = '';
    // 象限底（相鄰兩極之間）
    for (var q = 0; q < 4; q++) {
      var a = pt(q, 5), b = pt((q + 1) % 4, 5);
      svg.appendChild(el('polygon', { points: '0,0 ' + a.join(',') + ' ' + b.join(','), fill: mono ? 'none' : 'rgba(255,255,255,.55)' }));
    }
    for (var ring = 1; ring <= 5; ring++) {
      svg.appendChild(el('polygon', { 'class': 'ring', points: [0, 1, 2, 3].map(function (i) { return pt(i, ring).join(','); }).join(' '), fill: 'none', stroke: '#000', 'stroke-width': ring === 5 ? 1 : .35, 'stroke-dasharray': ring === 5 || mono ? 'none' : '2 3' }));
    }
    for (var i = 0; i < 4; i++) {
      var p = pt(i, 5);
      svg.appendChild(el('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], stroke: '#000', 'stroke-width': .6 }));
      var lx = p[0] * 1.14 + (i === 3 ? -4 : i === 1 ? 4 : 0), ly = p[1] * 1.14 + (i === 0 ? -14 : i === 2 ? 10 : 0);
      svg.appendChild(el('text', { x: lx, y: ly, 'text-anchor': i === 1 ? 'start' : i === 3 ? 'end' : 'middle', 'font-size': 23, 'font-weight': 400, 'letter-spacing': '2' }, poles[i].zh));
      svg.appendChild(el('text', { x: lx, y: ly + 19, 'text-anchor': i === 1 ? 'start' : i === 3 ? 'end' : 'middle', 'font-size': 11, 'font-family': 'monospace', 'letter-spacing': '1.2', fill: '#6c6c69' }, poles[i].en));
    }
    var pts = poles.map(function (p, i) { return pt(i, scores[p.id]); });
    var g = el('g', { id: 'shape' }); svg.appendChild(g);
    g.appendChild(el('polygon', { points: pts.map(function (x) { return x.join(','); }).join(' '), fill: mono ? 'rgba(0,0,0,.25)' : 'rgba(163,177,216,.7)', stroke: '#000', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
    pts.forEach(function (x, i) {
      svg.appendChild(el('circle', { 'class': 'node', cx: x[0], cy: x[1], r: 4.5, fill: mono ? '#000' : (['#fff', '#c9d2ea', '#cfcfcc', '#a3b1d8'][i]), stroke: '#000', 'stroke-width': 1.5 }));
      svg.appendChild(el('text', { 'class': 'node', x: x[0] + 8, y: x[1] - 7, 'font-size': 14, 'font-family': 'monospace' }, scores[poles[i].id].toFixed(1)));
    });
  }
  root.B2BB = root.B2BB || {}; root.B2BB.radar = { draw: draw };
})(window);
