/* 動態（GSAP 3）：克制、短、帶方向。所有動畫都可在 prefers-reduced-motion 下略過。
   - intro：面板與區塊依序淡入上移
   - view：切換畫面時，新內容由下往上錯落進場
   - count：大數字滾動到目標值
   - radar：多邊形由中心展開、節點依序出現
   - meter：錄音時的細線音量條 */
(function (root) {
  var G = root.gsap, reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!G && !reduce, EASE = 'expo.out';
  function intro() {
    if (!ok) return;
    G.from('.panel', { y: 24, opacity: 0, duration: 1, ease: EASE, stagger: .08 });
    G.from('.head .num, .head .ttl > *, .meta > div', { y: 18, opacity: 0, duration: .9, ease: EASE, stagger: .04, delay: .15 });
    G.from('#photo, .thumb', { opacity: 0, scale: .97, duration: .9, ease: EASE, stagger: .03, delay: .3 });
    G.from('.prompt, .work .card, .count-row, #view-idle .card, #qlist li', { y: 16, opacity: 0, duration: .8, ease: EASE, stagger: .03, delay: .45 });
  }
  function view(el) {
    if (!ok || !el) return;
    G.fromTo(el.querySelectorAll('.card, .type-row, .radar-card, .pole, .res-body, .back, .closing, #rate-scale > div'),
      { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: EASE, stagger: .045, overwrite: true });
  }
  function count(el, to, dec) {
    dec = dec || 0;
    if (!ok) { el.textContent = to.toFixed(dec); return; }
    var o = { v: parseFloat(el.textContent) || 0 };
    G.to(o, { v: to, duration: .9, ease: 'power3.out', onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
  }
  function radar(svg) {
    if (!ok) return;
    var shape = svg.querySelector('#shape'), dots = svg.querySelectorAll('.node');
    if (shape) G.from(shape, { scale: 0, transformOrigin: '0px 0px', duration: 1.2, ease: 'elastic.out(1,.75)', delay: .2 });
    G.from(dots, { scale: 0, transformOrigin: 'center', duration: .5, ease: 'back.out(3)', stagger: .08, delay: .7 });
    G.from(svg.querySelectorAll('.ring'), { opacity: 0, duration: .6, stagger: .05 });
  }
  function bars(nodes) {
    if (!ok) { nodes.forEach(function (u) { u.style.width = u.dataset.w; }); return; }
    G.to(nodes, { width: function (i, el) { return el.dataset.w; }, duration: 1, ease: 'power3.out', stagger: .05, delay: .3 });
  }
  var meterTl = null;
  function meter(on) {
    var bars = document.querySelectorAll('#meter i');
    if (meterTl) { meterTl.kill(); meterTl = null; }
    if (!G) return;
    if (!on) { G.to(bars, { scaleY: 1, height: '15%', duration: .4 }); return; }
    meterTl = G.to(bars, { height: function () { return (20 + Math.random() * 80) + '%'; }, duration: .18, ease: 'none', stagger: { each: .02, repeat: -1, yoyo: true, repeatRefresh: true } });
  }
  function pulse(el) { if (ok && el) G.fromTo(el, { scale: .92 }, { scale: 1, duration: .5, ease: 'back.out(3)' }); }
  function swapPhoto(img) { if (ok && img) G.fromTo(img, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .8, ease: EASE }); }
  function progress(el, dur) { if (G && el) G.fromTo(el, { width: '0%' }, { width: '100%', duration: dur, ease: 'power1.inOut' }); else if (el) el.style.width = '100%'; }
  root.B2BB = root.B2BB || {};
  root.B2BB.motion = { intro: intro, view: view, count: count, radar: radar, bars: bars, meter: meter, pulse: pulse, swapPhoto: swapPhoto, progress: progress };
})(window);
