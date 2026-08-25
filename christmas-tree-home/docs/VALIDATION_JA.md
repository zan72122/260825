# 検証記録

実施日：2026-08-25  
対象ブランチ：`feat/christmas-tree-home-20260825`

## 1. 検証対象

- `index.html`
- `styles.css`
- `src/main.js`
- `src/runtime/part-01.jsfrag`〜`part-06.jsfrag`
- 14個のscene builder
- 14個のvariant metadata
- 縦画面／横画面UI
- タッチ・矢印・番号選択
- モーダル・操作音
- WebGLシーン切替と破棄

## 2. JavaScript構文

### entry loader

```bash
node --check src/main.js
```

結果：**PASS**

### runtime本体

実行時と同じ順序で6 fragmentを連結し、構文を検査した。

```bash
cat \
  src/runtime/part-01.jsfrag \
  src/runtime/part-02.jsfrag \
  src/runtime/part-03.jsfrag \
  src/runtime/part-04.jsfrag \
  src/runtime/part-05.jsfrag \
  src/runtime/part-06.jsfrag \
  > /tmp/christmas-runtime.js

node --check /tmp/christmas-runtime.js
```

結果：**PASS**

## 3. 独自静的チェック

```bash
node tests/static-check.mjs
```

確認内容：

- 14個のvariant IDが存在し、重複しない
- 14個のbuilder関数が定義され、metadataから参照される
- 6 runtime fragmentがloaderに列挙される
- 必要なHTML IDが全て存在する
- Three.js r170のimport mapとentry moduleが存在する
- 木、スタンド、装飾、支線、足場、長い竿、木箱、台車のhelperが存在する
- `InstancedMesh`を使用する
- shadow map、ACES tone mapping、render loopを設定する
- coarse pointer向け28 pxスワイプ判定が存在する
- 旧sceneの明示的disposeが存在する
- 14種類のUI grammarがCSSに存在する
- portrait、short landscape、safe area、reduced motionが存在する
- CSSの波括弧数が一致する

結果：**PASS**

## 4. ローカルHTTP

```bash
python3 -m http.server 4173
```

以下の主要資源がHTTP 200で応答することを確認した。

- `/index.html`
- `/styles.css`
- `/src/main.js`
- `/src/runtime/part-01.jsfrag`
- `/src/runtime/part-06.jsfrag`
- `/docs/RESEARCH_JA.md`
- `/docs/GAME_PLAN_JA.md`
- `/docs/TOP_PAGE_VARIANTS_JA.md`

結果：**PASS**

## 5. Chromium実ブラウザ検証

Playwright Chromiumを用い、ローカルHTTPからページを読み込んだ。

### 実施内容

- 1365×768で初期表示
- `#app.is-ready`まで待機
- 14個のvariant dotが生成されることを確認
- 1番から14番まで全案を順に選択
- 各選択後にscene numberが更新されることを確認
- Console error／page errorを監視
- 1365×768の画面を保存
- 430×932へresizeし、縦画面を保存

結果：**PASS**

- 14案すべて切替成功
- JavaScript console errorなし
- page errorなし
- WebGL pageのready state到達
- 横画面・縦画面の双方でスクリーンショット生成成功

## 6. 実装上確認した事項

### 3D

- 木は幹、主枝、側枝、針葉群から生成される
- 針葉・反復装飾は`InstancedMesh`
- 枝密度・角度・長さにseed付き不均一性がある
- スタンドは脚、水槽、ボルト、必要に応じ重りを持つ
- 支線、コード、リボンは3D curve/tubeとして存在する
- 木箱、足場、台車、長い竿は厚みと接地を持つ
- 各世界は背景画像でなく、建築・床・道具をscene内に構築する

### UI

- 主要丸ボタン54〜56 px、開始ボタン64〜76 px級
- iOS safe area対応
- portrait時は画面下へ情報を集約
- short landscape時は高さを圧縮
- swipe、前後矢印、14 dot、keyboard arrowを実装
- `prefers-reduced-motion`で視差と遷移を抑える

### 性能

- 端末別にpixel ratio上限を設定
- scene切替時にgeometry/material/textureを破棄
- 重いpost-processingを使用しない
- point lightを限定し、電球の大部分はemissive geometry
- coarse pointer端末ではpixel ratio上限を低めにする

## 7. 残る実機確認

Chromiumでの検証は通過したが、次は**実際のiPhone/iPad Safari**で確認する必要がある。

- iPhone Safariのアドレスバー伸縮時の`100svh`
- Dynamic Island／ホームインジケータ周囲のsafe area
- iPad横画面でのGPU負荷、発熱、長時間メモリ
- CDN初回読込と低速回線
- Safari WebGLでの影品質・透明材質
- 実指での28 pxスワイプ感度
- VoiceOverの読み順
- 音をオンにした最初のユーザー操作後のAudioContext
- 旧端末での針葉密度・影解像度の自動低減

これらはコード上の対応だけでは断定できず、実機試験が必要である。

## 8. スコープ確認

今回の依頼どおり、実装範囲は**トップページのみ**である。

「はじめる」は、次回以降に実装する第1章の説明モーダルを開く。工程ゲームが既に完成しているようには見せていない。
