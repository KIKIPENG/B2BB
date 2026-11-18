#!/bin/bash
# 雙擊這個檔案即可在本機開啟網頁（麥克風需要 localhost 才能用）
cd "$(dirname "$0")"
PORT=8765
( sleep 1; open "http://localhost:$PORT/" ) &
echo "背面調查局：http://localhost:$PORT/   （關閉這個視窗即停止）"
python3 -m http.server $PORT
