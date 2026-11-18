/* 設計稿對照用：?state=empty（預設）｜?state=filled（全部填滿、動作都做完）｜?state=sheet（列印單預覽）
   filled 的內容是示範資料，不寫入 localStorage 的觀眾紀錄。 */
(function (root) {
  var q = new URLSearchParams(location.search), st = q.get('state');
  if (!st || st === 'empty') return;
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      root.B2BB.scene.demoFill({
        index: 0,
        data: {
          transcript: '我覺得這是一個很晚的地鐵月台，只有一個人在等車，廣播停了，很安靜，大概是在郊區的車站，剛下班的人準備回家。',
          guess: '深夜，有人在月台等最後一班車',
          location: '郊區的地鐵站月台',
          story: '剛下班的人準備回家，廣播停了，整個空間很安靜。',
          summary: '深夜的郊區地鐵月台，一個剛下班的人獨自等最後一班車。廣播已停，空間很安靜。',
          archived: true
        },
        other: '我覺得這是清晨剛開門的車站，還沒有什麼人，清潔人員剛擦完地板，空氣有點冷。'
      });
      root.B2BB.test.demoFill([4, 5, 3, 2, 5, 4, 3, 2, 4, 2]);
      if (st === 'sheet') root.B2BB.print.preview();
    }, 50);
  });
})(window);
