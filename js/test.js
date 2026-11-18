/* 條碼心理測驗（右 30%）：狀態機 idle → rate → (idle…) → confirm → loading → result */
(function (root) {
  var CFG = root.B2BB.CONFIG, SC = root.B2BB.scoring;
  var state = 'idle', answers = {}, pending = null, idleTimer = null, last = null;
  function $(id) { return document.getElementById(id); }
  function qById(id) { return CFG.questions.filter(function (q) { return q.id === id; })[0]; }
  function count() { return Object.keys(answers).length; }

  function show(v) {
    state = v;
    ['idle', 'rate', 'confirm', 'loading', 'result'].forEach(function (n) { $('view-' + n).classList.toggle('active', n === v); });
    $('progress-count').textContent = count() + ' / ' + CFG.questions.length;
    renderProgress();
  }
  function status(msg, err) { var s = $('status-line'); s.textContent = msg; s.className = 'status' + (err ? ' err' : ''); }
  function renderProgress() {
    var p = $('progress'); p.innerHTML = '';
    CFG.questions.forEach(function (q) {
      var d = document.createElement('div'); d.textContent = q.id.slice(1) + (answers[q.id] ? ':' + answers[q.id] : '');
      if (answers[q.id]) d.className = 'done'; if (pending === q.id) d.className = 'cur'; p.appendChild(d);
    });
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
      status(pending + ' 已記錄：' + k); var done = pending; pending = null;
      if (count() >= CFG.questions.length) { show('confirm'); status('10 題已完成，按 Enter 產生分析'); if (CFG.autoAnalyzeSec > 0) setTimeout(function () { if (state === 'confirm') analyze(); }, CFG.autoAnalyzeSec * 1000); }
      else { show('idle'); status('已記錄 ' + done + '：' + k + '，請掃描下一題'); }
      return;
    }
    if (state === 'rate') { status('請輸入 1 到 5', true); return; }
    if (state === 'confirm' && k === CFG.keys.analyze) { analyze(); }
  }

  function analyze() {
    show('loading'); status('分析中……');
    setTimeout(function () { showResult(SC.analyze(answers)); }, 2400);
  }
  function showResult(r) {
    var info = r.info; last = r;
    root.B2BB.radar.draw($('radar'), r.scores, CFG.poles);
    $('res-en').textContent = info.en; $('res-name').textContent = info.name;
    $('res-body').textContent = info.body; $('res-back').textContent = info.back;
    $('res-closing').textContent = CFG.closing;
    $('res-scores').textContent = CFG.poles.map(function (p) { return p.zh + ' ' + r.scores[p.id].toFixed(1); }).join('　');
    show('result'); status('分析完成。按 P 列印結果單');
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
