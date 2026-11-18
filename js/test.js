/* 條碼心理測驗（右 30%）：狀態機 idle → rate → (idle…) → confirm → loading → result */
(function (root) {
  var CFG = root.B2BB.CONFIG, SC = root.B2BB.scoring;
  var state = 'idle', answers = {}, pending = null, idleTimer = null, last = null;
  function $(id) { return document.getElementById(id); }
  function qById(id) { return CFG.questions.filter(function (q) { return q.id === id; })[0]; }
  function count() { return Object.keys(answers).length; }

  function show(v) {
    state = v; $('test-system').dataset.state = v;
    $('test-tag').textContent = { idle: 'STANDBY', rate: 'RATING', confirm: 'COMPLETE', loading: 'ANALYZING', result: 'RESULT' }[v];
    ['idle', 'rate', 'confirm', 'loading', 'result'].forEach(function (n) { $('view-' + n).classList.toggle('active', n === v); });
    $('progress-count').textContent = count() + ' / ' + CFG.questions.length;
    renderProgress();
    if (root.B2BB.motion) root.B2BB.motion.view($('view-' + v));
  }
  function status(msg, err) { var s = $('status-line'); s.textContent = msg; s.className = 'status' + (err ? ' err' : ''); }
  function renderProgress() {
    var p = $('qlist'), first = !p.children.length;
    if (first) CFG.questions.forEach(function (q) {
      var li = document.createElement('li'); li.id = 'li-' + q.id;
      li.innerHTML = '<span class="n">' + q.id.slice(1) + '</span><span class="t"></span><span class="tr"><u></u></span><span class="s">–</span>';
      li.querySelector('.t').textContent = q.text; p.appendChild(li);
    });
    CFG.questions.forEach(function (q) {
      var li = $('li-' + q.id), v = answers[q.id];
      li.className = (v ? 'done' : '') + (pending === q.id ? ' cur' : '');
      li.querySelector('.s').textContent = v || '–';
      li.querySelector('u').style.width = v ? (v / 5 * 100) + '%' : '0';
    });
    var c = $('count-now'), n = count();
    if (root.B2BB.motion && String(n) !== c.textContent) root.B2BB.motion.count(c, n, 0); else c.textContent = n;
  }
  function bumpIdle() {
    clearTimeout(idleTimer);
    if (CFG.idleResetSec > 0) idleTimer = setTimeout(reset, CFG.idleResetSec * 1000);
  }

  function onScan(code) {
    bumpIdle();
    if (state === 'loading') return;
    var q = qById(code);
    if (!q) { status('無法辨識「' + code + '」，請重新掃描', true); return; }
    if (state === 'result') reset();
    pending = q.id;
    $('rate-qid').textContent = q.id; $('rate-text').textContent = q.text;
    var sc = $('rate-scale'); sc.innerHTML = '';
    CFG.scale.forEach(function (label, i) {
      var d = document.createElement('div'); d.innerHTML = (i + 1) + '<small>' + label + '</small>';
      if (answers[q.id] === i + 1) d.className = 'on'; sc.appendChild(d);
    });
    $('rate-hint').textContent = answers[q.id] ? '已評 ' + answers[q.id] + ' 分，按 1–5 可修改' : '請按數字鍵 1–5';
    show('rate'); status('已掃描 ' + q.id + '，請按 1–5 評分');
  }

  function onKey(e) {
    bumpIdle();
    var k = e.key;
    if (k === CFG.keys.reset || k === 'Escape') { reset(); return; }
    if (state === 'rate' && /^[1-5]$/.test(k)) {
      answers[pending] = parseInt(k, 10);
      var cells = $('rate-scale').children; for (var ci = 0; ci < cells.length; ci++) cells[ci].className = ci === answers[pending] - 1 ? 'on' : '';
      if (root.B2BB.motion) root.B2BB.motion.pulse(cells[answers[pending] - 1]);
      status(pending + ' 已記錄：' + k); var done = pending; pending = null;
      if (count() >= CFG.questions.length) { show('confirm'); status('10 題已完成，按 Enter 產生分析'); if (CFG.autoAnalyzeSec > 0) setTimeout(function () { if (state === 'confirm') analyze(); }, CFG.autoAnalyzeSec * 1000); }
      else { show('idle'); status('已記錄 ' + done + '：' + k + '，請掃描下一題'); }
      return;
    }
    if (state === 'rate') { status('請輸入 1 到 5', true); return; }
    if (state === 'confirm' && k === CFG.keys.analyze) { analyze(); }
  }

  function analyze() {
    show('loading'); status('分析中……'); if (root.B2BB.motion) root.B2BB.motion.progress(document.querySelector('#view-loading .bar i'), 2.3);
    setTimeout(function () { showResult(SC.analyze(answers)); }, 2400);
  }
  function showResult(r) {
    var info = r.info; last = r;
    root.B2BB.radar.draw($('radar'), r.scores, CFG.poles);
    $('res-en').textContent = info.en; $('res-name').textContent = info.name;
    $('res-body').textContent = info.body; $('res-back').textContent = info.back;
    $('res-closing').textContent = CFG.closing;
    $('res-scores').textContent = CFG.poles.map(function (p) { return p.zh + ' ' + r.scores[p.id].toFixed(1); }).join('　');
    var pc = $('pole-cards'); pc.innerHTML = ''; var us = [], bs = [];
    CFG.poles.forEach(function (p) {
      var v = r.scores[p.id], d = document.createElement('div'); d.className = 'pole ' + p.id;
      d.innerHTML = '<b>0.0</b><span class="pk">' + p.en + '</span><span class="pz">' + p.zh + '</span><i><u data-w="' + Math.round((v - 1) / 4 * 100) + '%"></u></i>';
      pc.appendChild(d); us.push(d.querySelector('u')); bs.push([d.querySelector('b'), v]);
    });
    show('result'); status('分析完成。按 P 列印結果單');
    var M = root.B2BB.motion;
    if (M) { M.radar($('radar')); M.bars(us); bs.forEach(function (x) { M.count(x[0], x[1], 1); }); }
    else { us.forEach(function (u) { u.style.width = u.dataset.w; }); bs.forEach(function (x) { x[0].textContent = x[1].toFixed(1); }); }
    try { var log = JSON.parse(localStorage.getItem('b2bb.results.v1') || '[]'); log.push({ ts: Date.now(), answers: answers, result: r.result }); localStorage.setItem('b2bb.results.v1', JSON.stringify(log)); } catch (e) {}
  }

  function reset() {
    var had = count() > 0 || state === 'result';
    answers = {}; pending = null; last = null; show('idle'); status('請掃描條碼'); if (had && root.B2BB.scene) root.B2BB.scene.newVisitor();
    if (had) { var n = $('session-no'); n.textContent = ('000' + (parseInt(n.textContent, 10) + 1)).slice(-3); }
  }
  function init() { show('idle'); bumpIdle(); }
  function demoFill(vals) {
    CFG.questions.forEach(function (q, i) { answers[q.id] = vals[i]; });
    var r = SC.analyze(answers); show('result'); showResult(r);
    try { localStorage.removeItem('b2bb.results.v1'); } catch (e) {}
  }
  root.B2BB.test = { init: init, onScan: onScan, onKey: onKey, reset: reset, getResult: function () { return last; }, getState: function () { return state; }, demoFill: demoFill };
})(window);
