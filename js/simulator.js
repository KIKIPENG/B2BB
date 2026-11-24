/* 模擬輸入面板（給沒有條碼槍的人試玩）。
   預設隱藏，不影響展場實機掃描。開啟方式：網址加 ?sim=1，或按 ` 鍵（反引號，條碼槍不會送出這個字元）。
   面板的按鈕會送出和條碼槍／鍵盤完全一樣的 keydown 事件，走 app.js 的同一條輸入路徑，所以所有狀態都能到達。 */
(function (root) {
  var CFG = root.B2BB.CONFIG, panel, flash, open = true;

  function key(k) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }
  // 與掃描器相同：一連串字元（同一個瞬間送出）＋ Enter
  function scan(code) { code.split('').forEach(key); key('Enter'); }

  function say(t) { flash.textContent = t; }
  function btn(label, cls, fn, sub) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sim-btn' + (cls ? ' ' + cls : '');
    b.innerHTML = label + (sub ? '<small>' + sub + '</small>' : '');
    b.addEventListener('click', function () { fn(); b.blur(); });
    return b;
  }
  function row(title, en) {
    var h = document.createElement('div'); h.className = 'sim-k'; h.innerHTML = en + '<em> ' + title + '</em>'; return h;
  }

  function build() {
    panel = document.createElement('aside');
    panel.id = 'sim'; panel.setAttribute('aria-label', '模擬輸入面板');
    var head = document.createElement('div'); head.className = 'sim-head';
    head.innerHTML = '<span class="sim-tag">SIMULATOR</span><span class="sim-t">模擬輸入</span>';
    var min = document.createElement('button'); min.type = 'button'; min.className = 'sim-min'; min.setAttribute('aria-label', '收合');
    min.textContent = '–'; head.appendChild(min);
    panel.appendChild(head);

    var body = document.createElement('div'); body.className = 'sim-body';
    body.appendChild(row('掃描條碼', 'BARCODE'));
    var g = document.createElement('div'); g.className = 'sim-grid five';
    CFG.questions.forEach(function (q) { g.appendChild(btn(q.id, '', function () { scan(q.id); say('掃描 ' + q.id); })); });
    body.appendChild(g);
    var inv = document.createElement('div'); inv.className = 'sim-grid one';
    inv.appendChild(btn('Q99', 'ghost', function () { scan('Q99'); say('掃描 Q99（無效條碼）'); }, '無效條碼'));
    body.appendChild(inv);

    body.appendChild(row('評分', 'SCORE'));
    var s = document.createElement('div'); s.className = 'sim-grid five';
    CFG.scale.forEach(function (label, i) { s.appendChild(btn(String(i + 1), '', function () { key(String(i + 1)); say('按下 ' + (i + 1)); }, label)); });
    body.appendChild(s);

    body.appendChild(row('操作', 'CONTROL'));
    var c = document.createElement('div'); c.className = 'sim-grid two';
    c.appendChild(btn('ENTER', 'blue', function () { key('Enter'); say('Enter　產生分析'); }, '產生分析'));
    c.appendChild(btn('0', 'dark', function () { key('0'); say('0　重新開始'); }, '重新開始'));
    body.appendChild(c);

    flash = document.createElement('div'); flash.className = 'sim-status'; flash.textContent = '點按鈕＝模擬條碼槍／數字鍵';
    body.appendChild(flash);
    var foot = document.createElement('div'); foot.className = 'sim-foot'; foot.innerHTML = '` 鍵可隱藏／顯示面板';
    body.appendChild(foot);
    panel.appendChild(body);
    document.body.appendChild(panel);

    min.addEventListener('click', function () { setOpen(!open); min.blur(); });
    drag(head);
  }

  function setOpen(v) {
    open = v; panel.classList.toggle('closed', !v);
    panel.querySelector('.sim-min').textContent = v ? '–' : '+';
  }
  function show(v) { panel.style.display = v ? '' : 'none'; if (v) setOpen(true); }

  function drag(handle) {
    var sx, sy, ox, oy, on = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.sim-min')) return;
      var r = panel.getBoundingClientRect(); on = true; sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!on) return;
      var x = Math.max(0, Math.min(innerWidth - 80, ox + e.clientX - sx)), y = Math.max(0, Math.min(innerHeight - 40, oy + e.clientY - sy));
      panel.style.left = x + 'px'; panel.style.top = y + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    handle.addEventListener('pointerup', function () { on = false; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    build();
    var q = new URLSearchParams(location.search).get('sim');
    show(q === '1' || q === 'true');
    // 反引號切換（條碼內容只有 Qnn，不會出現這個字元）
    document.addEventListener('keydown', function (e) {
      if (e.key !== '`' || !e.isTrusted) return;
      var el = document.activeElement;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      e.preventDefault(); e.stopPropagation();
      show(panel.style.display === 'none');
    }, true);
  });
})(window);
