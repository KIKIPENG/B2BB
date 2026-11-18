/* 列印單：點陣印表機（黑白、等寬字）。內容 = 四象限雷達圖＋觀察者類型＋你的描述＋另一位觀眾的描述。
   尺寸見 config.print（⚠️ 待確認實際紙張）。按 P 觸發；?state=sheet 可在畫面預覽。 */
(function (root) {
  var CFG = root.B2BB.CONFIG;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function build() {
    var res = root.B2BB.test.getResult(), mine = root.B2BB.scene.getMine(), other = root.B2BB.scene.getOther(), sc = root.B2BB.scene.getScene();
    var d = new Date(), stamp = d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var svgHTML = '';
    if (res) { var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); tmp.setAttribute('viewBox', '-185 -165 370 330'); root.B2BB.radar.draw(tmp, res.scores, CFG.poles, true); svgHTML = tmp.outerHTML; }
    var info = res && res.info;
    $('print-sheet').innerHTML =
      '<header><b>背面調查局 BACK TO BACK BUREAU</b><span>SESSION_' + $('session-no').textContent + ' / ' + stamp + '</span></header>' +
      '<div class="cols">' +
        '<div class="c1">' + svgHTML +
          (info ? '<div class="tn">' + esc(info.name) + '</div><div class="te">' + esc(info.en) + '</div><div class="ts">' + CFG.poles.map(function (p) { return p.zh + ' ' + res.scores[p.id].toFixed(1); }).join('  ') + '</div>' : '<div class="ts">（尚未完成觀察記錄表）</div>') +
        '</div>' +
        '<div class="c2">' +
          '<h3>' + esc(sc.id) + ' / 你的描述 YOUR VIEW</h3><p>' + esc(mine ? mine.summary : '（尚未歸檔）') + '</p>' +
          '<h3>另一位觀眾的描述 ANOTHER VIEW</h3><p>' + esc(other ? other.summary : '（無）') + '</p>' +
        '</div>' +
      '</div>' +
      '<footer>' + (info ? esc(info.back) + ' ／ ' : '') + '你看到我看不到，我看到的你也看不到。</footer>';
  }

  function printSheet() {
    var res = root.B2BB.test.getResult(), mine = root.B2BB.scene.getMine();
    var miss = []; if (!res) miss.push('右側觀察記錄表的分析結果'); if (!mine) miss.push('左側場景描述的歸檔');
    if (miss.length) { var s = document.getElementById('status-line'); s.textContent = '尚缺：' + miss.join('、'); s.className = 'status err'; return false; }
    build();
    var st = document.getElementById('print-style'); if (!st) { st = document.createElement('style'); st.id = 'print-style'; document.head.appendChild(st); }
    st.textContent = '@page{size:' + CFG.print.widthMm + 'mm ' + CFG.print.heightMm + 'mm;margin:0}';
    root.print(); return true;
  }
  function preview() { build(); document.body.classList.add('preview-sheet'); }
  root.B2BB.print = { print: printSheet, preview: preview };
})(window);
