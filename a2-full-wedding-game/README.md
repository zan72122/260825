# A2 コーラル・リボン・パレード — 全工程ゲーム

このディレクトリがゲーム本体です。

## Macでの起動方法

### まだ `260825` をcloneしていない場合

Terminalで次を上から順に実行してください。

```bash
cd ~
git clone --branch feature/a2-full-wedding-floral-game --single-branch https://github.com/zan72122/260825.git
cd ~/260825/a2-full-wedding-game
python3 -m http.server 4173
```

そのままTerminalを閉じず、SafariまたはChromeで次を開きます。

```text
http://localhost:4173/
```

## すでに `260825` をclone済みの場合

今回の「会場と花材を準備しています」が終わらない問題の修正を取得するため、必ず最新版へ更新してください。

```bash
cd ~/260825
git fetch origin
git switch feature/a2-full-wedding-floral-game
git pull --ff-only origin feature/a2-full-wedding-floral-game
cd a2-full-wedding-game
python3 -m http.server 4173
```

`~/260825` 以外の場所へcloneしている場合は、`~/260825` を実際のclone先に置き換えてください。

## パス確認

サーバー起動前に以下を実行します。

```bash
pwd
ls
```

期待される表示内容:

```text
.../260825/a2-full-wedding-game
README.md
app.js
bootstrap.js
index.html
styles.css
three-bridge.js
```

## 起動が止まらないための対策

旧版は `app.js` が jsDelivr 上の Three.js を静的 import していたため、その通信が止まるとアプリ側の例外処理へ到達できず、ローディング表示が残り続ける問題がありました。

現行版では次の対策を入れています。

- `bootstrap.js` が起動全体を監視
- Three.js は unpkg / esm.sh / jsDelivr の複数経路から最初に成功したものを使用
- Three.js読込を8秒で打ち切り
- アプリ全体を12秒で監視し、失敗時は永久スピナーではなくエラー画面へ移行
- `#loading[hidden]` を `display:none !important` として確実に非表示化

更新後も古い画面が残る場合は、ブラウザで強制再読み込みしてください。Safariでは `Option + Command + R`、Chromeでは `Shift + Command + R` が使えます。

## ゲーム内容

A2「コーラル・リボン・パレード」を固定テーマとして、相談・色決めから、入荷、洗浄、水、開梱、葉取り、切り戻し、水揚げ、仕分け、装花制作、梱包、積込、輸送、荷下ろし、現地設営、品質確認、完成披露、披露宴への再配置、撤去・分別まで19工程を扱います。

各工程では指のドラッグ量が連続的に3D状態へ反映されます。開始状態と完成状態を静止画で切り替える方式ではありません。
