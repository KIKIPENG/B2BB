/* SVG 雷達圖：上、右、下、左 = 物件、空間、事件、人物；半徑 1 分在中心、5 分在外圈 */
(function (root) {
  var NS = 'http://www.w3.org/2000/svg', R = 110;
  var ANG = [-90, 0, 90, 180]; // 度
  function pt(i, v) { var r = R * (v - 1) / 4, a = ANG[i] * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }
  function el(n, attrs, text) { var e = document.createElementNS(NS, n); for (var k in attrs) e.setAttribute(k, attrs[k]); if (text) e.textContent = text; return e; }

  function draw(svg, scores, poles, mono) {
    svg.innerHTML = '';
    // 象限底（相鄰兩極之間）
    for (var q = 0; q < 4; q++) {
      var a = pt(q, 5), b = pt((q + 1) % 4, 5);
      svg.appendChild(el('polygon', { points: '0,0 ' + a.join(',') + ' ' + b.join(','), fill: mono ? 'none' : (q % 2 ? '#d4d4d0' : '#e2e2de') }));
    }
    for (var ring = 1; ring <= 5; ring++) {
      svg.appendChild(el('polygon', { points: [0, 1, 2, 3].map(function (i) { return pt(i, ring).join(','); }).join(' '), fill: 'none', stroke: '#000', 'stroke-width': ring === 5 ? 1.2 : .4 }));
    }
    for (var i = 0; i < 4; i++) {
      var p = pt(i, 5);
      svg.appendChild(el('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], stroke: '#000', 'stroke-width': .6 }));
      var lx = p[0] * 1.2 + (i === 3 ? -4 : i === 1 ? 4 : 0), ly = p[1] * 1.2 + (i === 0 ? -4 : i === 2 ? 12 : 4);
      svg.appendChild(el('text', { x: lx, y: ly, 'text-anchor': i === 1 ? 'start' : i === 3 ? 'end' : 'middle', 'font-size': 14, 'font-weight': 700, 'font-family': 'sans-serif' }, poles[i].zh));
    }
    var pts = poles.map(function (p, i) { return pt(i, scores[p.id]); });
    svg.appendChild(el('polygon', { points: pts.map(function (x) { return x.join(','); }).join(' '), fill: mono ? 'rgba(0,0,0,.25)' : 'rgba(143,163,217,.55)', stroke: '#000', 'stroke-width': 2 }));
    pts.forEach(function (x, i) {
      svg.appendChild(el('circle', { cx: x[0], cy: x[1], r: 4, fill: '#000' }));
      svg.appendChild(el('text', { x: x[0] + 7, y: x[1] - 6, 'font-size': 10, 'font-family': 'monospace' }, scores[poles[i].id].toFixed(1)));
    });
  }
  root.B2BB = root.B2BB || {}; root.B2BB.radar = { draw: draw };
})(window);
