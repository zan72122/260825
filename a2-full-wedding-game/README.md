# A2 コーラル・リボン・パレード — 全工程ゲーム

このディレクトリがゲーム本体です。

## Macでの起動方法

**まだ `260825` をcloneしていない場合**は、Terminalで次を上から順に実行してください。

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

以前cloneしたフォルダには、新しく追加した `a2-full-wedding-game` がまだ無い可能性があります。その場合はcloneし直すか、次を実行してください。

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

サーバー起動前に、以下で3ファイルが見えれば正しい場所です。

```bash
pwd
ls
```

期待される表示内容:

```text
.../260825/a2-full-wedding-game
README.md
app.js
index.html
styles.css
```

## ゲーム内容

A2「コーラル・リボン・パレード」を固定テーマとして、相談・色決めから、入荷、洗浄、水、開梱、葉取り、切り戻し、水揚げ、仕分け、装花制作、梱包、積込、輸送、荷下ろし、現地設営、品質確認、完成披露、披露宴への再配置、撤去・分別まで19工程を扱います。

各工程では指のドラッグ量が連続的に3D状態へ反映されます。開始状態と完成状態を静止画で切り替える方式ではありません。
