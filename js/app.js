/* 啟動與輸入分流：
   掃描器為「鍵盤模擬」：快速輸入條碼內容 + Enter。條碼內容以 Qnn 結尾即可（例如 Q01、BTB-Q01、B2BB-OBS-Q01）。
   - 掃描時若游標在左側文字框，會把掃進去的字還原，不會污染描述內容。
   - 一般鍵盤輸入（描述文字）不受影響；1–5 / Enter / 0 只在非文字框時作為測驗按鍵。 */
(function (root) {
  var burst = '', lastT = 0, snapshot = null, snapEl = null, printTimer = null;
  var MAX_GAP = 60; // ms：掃描器字元間隔上限

  function isField(el) { return el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'); }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var now = Date.now(), el = document.activeElement;

    if (e.key.length === 1) {
      var fresh = now - lastT > MAX_GAP || (/^[a-z]$/i.test(e.key) && /^\d*$/.test(burst));
      if (fresh) { burst = ''; snapshot = isField(el) ? el.value : null; snapEl = isField(el) ? el : null; }
      lastT = now; burst += e.key;
      if (isField(el)) return; // 打字，交給文字框
      if (/^[a-z]/i.test(burst)) { // 以字母開頭：掃描器輸入中（或單按 P 列印）
        clearTimeout(printTimer);
        if (burst.length === 1 && burst.toLowerCase() === root.B2BB.CONFIG.print.key) {
          printTimer = setTimeout(function () { if (burst.length === 1) root.B2BB.print.print(); }, MAX_GAP * 2);
        }
        return;
      }
    } else if (e.key === 'Enter') {
      var m = /Q\d{2}$/i.exec(burst);
      if (m && /^[a-z]/i.test(burst) && now - lastT <= MAX_GAP * 2) {
        e.preventDefault();
        if (snapEl && snapshot !== null) snapEl.value = snapshot; // 還原誤打入的字
        if (document.activeElement && isField(document.activeElement)) document.activeElement.blur();
        burst = ''; root.B2BB.test.onScan(m[0].toUpperCase()); return;
      }
      if (isField(el)) return;
    } else if (e.key !== 'Escape' && e.key !== 'Backspace') { return; }

    if (isField(el) && e.key !== 'Escape') return;
    root.B2BB.test.onKey(e);
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    root.B2BB.scene.init(); root.B2BB.test.init(); if (root.B2BB.motion && !/state=/.test(location.search)) root.B2BB.motion.intro();
  });
})(window);
