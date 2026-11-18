/* 場景描述系統（左 70%）：選照片 → 對麥克風說 → 逐字稿 → AI 整理 → 歸檔 → 取得另一位觀眾的描述。
   狀態：empty → recording → transcribed → organizing → organized → archived
   資料存 localStorage：b2bb.archive.v2（陣列，每筆為一位觀眾對一張照片的描述） */
(function (root) {
  var CFG = root.B2BB.CONFIG, KEY = 'b2bb.archive.v2';
  var current = 0, state = 'empty', rec = null, recTimer = null, recSec = 0, finalText = '', visitor = 1;
  var draft = {}; // { SCN_01: {transcript, guess, location, story, summary} }
  var mine = null, other = null;

  function $(id) { return document.getElementById(id); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function loadArchive() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function saveArchive(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  function sc() { return CFG.scenes[current]; }
  function placeholder(id) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#555"/><text x="50%" y="50%" fill="#ddd" font-family="monospace" font-size="28" text-anchor="middle">' + id + ' (NO IMAGE)</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  function img(src, id) { var i = new Image(); i.alt = id; i.onerror = function () { i.onerror = null; i.src = placeholder(id); }; i.src = src; return i; }
  function toast(m) { $('scene-toast').textContent = m; clearTimeout(toast.t); toast.t = setTimeout(function () { $('scene-toast').textContent = ''; }, 3000); }

  var LABEL = { empty: 'EMPTY', recording: '● RECORDING', transcribed: 'TRANSCRIBED', organizing: 'ORGANIZING', organized: 'READY', archived: 'ARCHIVED' };
  function setState(s) {
    state = s;
    var st = $('scene-state'); st.textContent = LABEL[s]; st.className = 'tag ' + s;
    var rb = $('btn-rec'); rb.classList.toggle('on', s === 'recording');
    rb.textContent = s === 'recording' ? '■ 停止' : '● 開始說話';
    var M = root.B2BB.motion; if (M) M.meter(s === 'recording');
    $('btn-organize').disabled = !($('transcript').value.trim()) || s === 'recording' || s === 'organizing';
    $('btn-archive').disabled = s !== 'organized';
    $('btn-archive').textContent = s === 'archived' ? '已歸檔 Archived ✓' : '歸檔 Archive Record →';
    $('btn-redo').disabled = s === 'empty' || s === 'recording';
    $('ai-state').textContent = s === 'organizing' ? '整理中…' : '';
  }

  /* ---------- 大圖＋其餘 9 張縮圖 ---------- */
  function renderGrid() {
    var g = $('scene-grid'); g.innerHTML = '';
    var arch = loadArchive();
    CFG.scenes.forEach(function (s, i) {
      if (i === current) return;
      var b = document.createElement('button'); b.type = 'button';
      var done = arch.some(function (a) { return a.scene === s.id && a.visitor === visitor; });
      b.className = 'thumb' + (done ? ' done' : ''); b.title = s.id; b.setAttribute('data-no', pad(i + 1));
      b.appendChild(img(s.src, s.id));
      b.addEventListener('click', function () { if (state === 'recording') stopRec(); open(i); });
      g.appendChild(b);
    });
  }
  function fill(d) {
    $('transcript').value = d.transcript || '';
    $('ai-guess').textContent = d.guess || '—'; $('ai-location').textContent = d.location || '—'; $('ai-story').textContent = d.story || '—';
    $('ai-summary').textContent = d.summary || '—';
  }
  function showOther() {
    var arch = loadArchive(), id = sc().id;
    var others = arch.filter(function (a) { return a.scene === id && a.visitor !== visitor; });
    var t;
    if (others.length) { other = others[others.length - 1]; t = other.summary; }
    else { var seed = CFG.seedDescriptions[id]; other = { scene: id, summary: seed ? seed.summary : CFG.seedFallback, seed: true }; t = other.summary; }
    $('other-text').textContent = t;
  }
  function open(i) {
    current = i; var s = sc(), d = draft[s.id] || {};
    var im = $('scene-img'); im.onerror = function () { im.onerror = null; im.src = placeholder(s.id); }; im.src = s.src;
    $('photo-tag').textContent = s.id; $('photo-no').textContent = pad(i + 1);
    if (root.B2BB.motion) root.B2BB.motion.swapPhoto(im);
    fill(d); finalText = d.transcript || '';
    $('other-text').textContent = '歸檔後，這裡會出現另一位觀眾針對同一張照片的描述。'; other = null;
    setState(d.archived ? 'archived' : d.summary ? 'organized' : d.transcript ? 'transcribed' : 'empty');
    if (d.archived) showOther();
    renderGrid();
  }

  /* ---------- 錄音 / 語音辨識 ---------- */
  function fmt(n) { return pad(Math.floor(n / 60)) + ':' + pad(n % 60); }
  function startRec() {
    var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SR) { toast('此瀏覽器不支援語音辨識，請改用 Chrome，或直接在逐字稿框輸入。'); $('transcript').focus(); return; }
    rec = new SR(); rec.lang = CFG.speech.lang; rec.continuous = true; rec.interimResults = true;
    finalText = $('transcript').value.trim(); var base = finalText;
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var t = e.results[i][0].transcript;
        if (e.results[i].isFinal) base += (base ? '，' : '') + t.trim(); else interim += t;
      }
      $('transcript').value = base + (interim ? (base ? '，' : '') + interim : ''); finalText = base;
      $('btn-organize').disabled = !$('transcript').value.trim();
    };
    rec.onerror = function (e) { toast('麥克風錯誤：' + e.error); stopRec(); };
    rec.onend = function () { if (state === 'recording') stopRec(); };
    try { rec.start(); } catch (e) { toast('無法啟動麥克風'); return; }
    recSec = 0; $('rec-timer').textContent = '00:00'; setState('recording');
    recTimer = setInterval(function () { recSec++; $('rec-timer').textContent = fmt(recSec); if (recSec >= CFG.speech.maxSec) stopRec(); }, 1000);
  }
  function stopRec() {
    clearInterval(recTimer); try { rec && rec.stop(); } catch (e) {}
    rec = null; var t = $('transcript').value.trim();
    if (state === 'recording') setState(t ? 'transcribed' : 'empty');
    draft[sc().id] = draft[sc().id] || {}; draft[sc().id].transcript = t;
  }

  /* ---------- AI 整理 ---------- */
  function offline(t) {
    var parts = t.split(/[。！？!?\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var loc = parts.filter(function (x) { return /在|站|店|路|裡|內|外|地方|附近|樓/.test(x); })[0] || '';
    return { guess: parts[0] || '', location: loc, story: parts.slice(1).join('，') || parts[0] || '', summary: t, offline: true };
  }
  function organize() {
    var t = $('transcript').value.trim(); if (!t) return;
    setState('organizing'); var s = sc();
    var done = function (r) {
      r = r || offline(t); r.transcript = t; draft[s.id] = r; fill(r);
      $('ai-state').textContent = r.offline ? '（離線模式：未接 AI，僅斷句）' : ''; setState('organized');
    };
    if (!CFG.ai.endpoint) { setTimeout(function () { done(offline(t)); }, 600); return; }
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, CFG.ai.timeoutMs);
    fetch(CFG.ai.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: s.id, transcript: t }), signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { clearTimeout(to); done({ guess: j.guess, location: j.location, story: j.story, summary: j.summary || t }); })
      .catch(function () { clearTimeout(to); toast('AI 無回應，改用離線整理'); done(offline(t)); });
  }

  /* ---------- 草稿 / 歸檔 / 重錄 ---------- */
  function redo() { delete draft[sc().id]; fill({}); $('transcript').value = ''; finalText = ''; $('rec-timer').textContent = '00:00'; setState('empty'); renderGrid(); }
  function archive() {
    var d = draft[sc().id]; if (!d || !d.summary) { toast('請先「整理成描述」'); return; }
    var rec_ = { scene: sc().id, visitor: visitor, ts: Date.now(), transcript: d.transcript, guess: d.guess, location: d.location, story: d.story, summary: d.summary };
    var arch = loadArchive(); arch.push(rec_); saveArchive(arch);
    d.archived = true; mine = rec_; setState('archived'); showOther(); renderGrid();
    toast('已歸檔：' + sc().id + '。按 P 列印（需先完成右側測驗）');
  }
  function newVisitor() { visitor++; draft = {}; mine = null; other = null; open(0); }

  function init() {
    var m = $('meter'); for (var k = 0; k < 28; k++) m.appendChild(document.createElement('i'));
    open(0);
    $('btn-rec').addEventListener('click', function () { state === 'recording' ? stopRec() : startRec(); });
    $('btn-redo').addEventListener('click', redo);
    $('btn-organize').addEventListener('click', organize);
    $('btn-archive').addEventListener('click', archive);
    $('transcript').addEventListener('input', function () { if (state === 'empty') setState('transcribed'); setState(state === 'organized' ? 'transcribed' : state); });
  }
  function demoFill(d) { // 展示用：直接放入已完成狀態
    open(d.index || 0); draft[sc().id] = d.data; fill(d.data); /* 不寫入 localStorage，僅畫面 */
    draft[sc().id].archived = true; mine = { scene: sc().id, visitor: visitor, summary: d.data.summary, transcript: d.data.transcript };
    other = { scene: sc().id, summary: d.other, seed: true }; $('other-text').textContent = d.other; setState('archived'); renderGrid(); $('rec-timer').textContent = '00:23';
  }
  root.B2BB.scene = { init: init, newVisitor: newVisitor, demoFill: demoFill,
    getMine: function () { return mine; }, getOther: function () { return other; }, getScene: sc };
})(window);
