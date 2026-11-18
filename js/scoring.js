/* 計分與類型判定（純函式，可在 node 測試） */
(function (root) {
  var CFG = (typeof module !== 'undefined') ? require('./config.js') : root.B2BB.CONFIG;

  // answers: { Q01: 1..5, ... }
  function poleScores(answers) {
    var out = {};
    CFG.poles.forEach(function (p) {
      var qs = CFG.questions.filter(function (q) { return q.pole === p.id; });
      var vals = qs.map(function (q) { return answers[q.id]; }).filter(function (v) { return typeof v === 'number'; });
      out[p.id] = vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
    });
    return out;
  }

  function classify(scores) {
    var order = CFG.poles.map(function (p) { return p.id; });
    var vals = order.map(function (id) { return scores[id]; });
    var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    if (vals.every(function (v) { return v >= 4.0; })) return { kind: 'special', key: 'trusting' };
    if (vals.every(function (v) { return v <= 2.0; })) return { kind: 'special', key: 'reserved' };
    if (max - min <= 0.5) return { kind: 'special', key: 'balanced' };

    var top = order.reduce(function (best, id) { return scores[id] > scores[best] ? id : best; }, order[0]); // 同分取順序在前
    var i = order.indexOf(top);
    var prev = order[(i + 3) % 4], next = order[(i + 1) % 4];
    var sub = scores[prev] > scores[next] ? prev : (scores[next] > scores[prev] ? next : (order.indexOf(prev) < order.indexOf(next) ? prev : next));
    var key = [top, sub].sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    // 環狀相鄰：person 與 object 相鄰，key 固定為 'person+object'
    var k = (key[0] === 'object' && key[1] === 'person') ? 'person+object' : key.join('+');
    return { kind: 'type', key: k, top: top, sub: sub };
  }

  function analyze(answers) {
    var s = poleScores(answers);
    var c = classify(s);
    var info = c.kind === 'type' ? CFG.types[c.key] : CFG.specials[c.key];
    return { scores: s, result: c, info: info };
  }

  var API = { poleScores: poleScores, classify: classify, analyze: analyze };
  if (typeof module !== 'undefined') module.exports = API;
  else { root.B2BB = root.B2BB || {}; root.B2BB.scoring = API; }
})(typeof window !== 'undefined' ? window : globalThis);
