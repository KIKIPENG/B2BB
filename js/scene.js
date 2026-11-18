/* 場景描述系統（左 70%）。資料存 localStorage，key: b2bb.records.v1 */
(function (root) {
  var CFG = root.B2BB.CONFIG, KEY = 'b2bb.records.v1';
  var current = 0, records = load(), dirty = false;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(records)); } catch (e) {} }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function placeholder(id) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#555"/><text x="50%" y="50%" fill="#ddd" font-family="monospace" font-size="28" text-anchor="middle">' + id + ' (NO IMAGE)</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
  function img(src, id, cls) { var i = new Image(); i.alt = id; if (cls) i.className = cls; i.onerror = function () { i.onerror = null; i.src = placeholder(id); }; i.src = src; return i; }
  function $(id) { return document.getElementById(id); }

  function renderGrid() {
    var g = $('scene-grid'); g.innerHTML = '';
    CFG.scenes.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'thumb' + (i === current ? ' sel' : '') + (records[s.id] && records[s.id].status !== 'draft' ? ' done' : '');
      b.appendChild(img(s.src, s.id)); var sp = document.createElement('span'); sp.textContent = s.id + '.JPG'; b.appendChild(sp);
      b.addEventListener('click', function () { open(i); });
      g.appendChild(b);
    });
    $('scene-count').textContent = pad(CFG.scenes.length) + ' ITEMS';
    var c = { draft: 0, submitted: 0 };
    CFG.scenes.forEach(function (s) { var r = records[s.id]; if (r) c[r.status === 'draft' ? 'draft' : 'submitted']++; });
    $('col-unresolved').innerHTML = '+ UNRESOLVED <b>' + pad(CFG.scenes.length - c.submitted) + '</b>';
    $('col-submitted').innerHTML = '+ SUBMITTED <b>' + pad(c.submitted) + '</b>';
    $('col-archived').innerHTML = '+ ARCHIVED <b>' + pad(c.submitted) + '</b>';
  }

  function buildForm() {
    var f = $('scene-form'); f.innerHTML = '';
    CFG.sceneFields.forEach(function (fd) {
      var l = document.createElement('label'); l.textContent = fd.label; l.htmlFor = 'f-' + fd.key;
      var t = document.createElement('textarea'); t.id = 'f-' + fd.key; t.rows = fd.rows; t.placeholder = fd.hint;
      t.addEventListener('input', function () { setDirty(true); });
      f.appendChild(l); f.appendChild(t);
    });
  }
  function setDirty(v) { dirty = v; var d = $('dirty'); d.textContent = v ? '● UNSAVED' : '● SAVED'; d.className = v ? '' : 'saved'; }
  function toast(m) { $('scene-toast').textContent = m; clearTimeout(toast.t); toast.t = setTimeout(function () { $('scene-toast').textContent = ''; }, 2500); }

  function open(i) {
    current = i; var s = CFG.scenes[i], r = records[s.id] || {};
    var im = $('scene-img'); im.onerror = function () { im.onerror = null; im.src = placeholder(s.id); }; im.src = s.src;
    $('scene-tab').textContent = s.id + '.JPG'; $('sel-title').textContent = s.id + '.JPG';
    $('sel-meta').textContent = s.meta + ' / FILE ' + pad(i + 1) + ' OF ' + pad(CFG.scenes.length);
    $('scene-caption').textContent = s.id + '.JPG  •  SELECTED';
    $('record-id').textContent = 'RECORD ID BTB-009-' + pad(i + 1);
    CFG.sceneFields.forEach(function (fd) { $('f-' + fd.key).value = r[fd.key] || ''; });
    $('status').textContent = (r.status || 'draft').toUpperCase(); setDirty(false);
    renderGrid();
  }
  function collect(status) {
    var s = CFG.scenes[current], r = { status: status, ts: Date.now() };
    CFG.sceneFields.forEach(function (fd) { r[fd.key] = $('f-' + fd.key).value.trim(); });
    records[s.id] = r; save(); return r;
  }
  function saveDraft() { collect('draft'); setDirty(false); $('status').textContent = 'DRAFT'; toast('已儲存草稿'); renderGrid(); }
  function archive() {
    var r = collect('submitted');
    if (!r.guess && !r.location && !r.story) { delete records[CFG.scenes[current].id]; save(); toast('請至少填寫一欄'); return; }
    setDirty(false); $('status').textContent = 'SUBMITTED'; toast('已歸檔：' + CFG.scenes[current].id);
    renderGrid();
    if (current < CFG.scenes.length - 1) setTimeout(function () { open(current + 1); }, 700);
  }
  function resetAll() { records = {}; save(); open(0); }

  function init() {
    buildForm(); open(0);
    $('btn-draft').addEventListener('click', saveDraft);
    $('btn-archive').addEventListener('click', archive);
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); archive(); }
    });
  }
  root.B2BB.scene = { init: init, resetAll: resetAll, getRecords: function () { return records; } };
})(window);
