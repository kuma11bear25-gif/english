# マイ英語文章帳

英語の勉強用に、自分だけの英語文章帳を作れるシンプルなWebアプリです。ビルド不要のHTML/CSS/JavaScriptだけで動きます。

## 機能

- 英語文章をメモできる
- 保存した文章を音声で読み上げ（ブラウザのWeb Speech API）
- 入力した英語文章を自動で日本語訳（MyMemory Translation APIを使用、手動編集も可）
- フラッシュカード形式で学習できる
- フラッシュカードは「英語→日本語」「日本語→英語」を切り替え可能

## 使い方

ビルドは不要です。`index.html` をブラウザで直接開くか、簡易サーバーで配信してください。

```bash
# 例: Pythonの簡易サーバーを使う場合
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

GitHub Pagesなどの静的ホスティングにもそのままデプロイできます。

## データの保存先

入力した文章はブラウザの `localStorage` に保存されます。サーバーには送信されません（翻訳時のみ、翻訳APIへ英語文章を送信します）。

## 技術構成

- `index.html`: 画面構成（追加 / 一覧 / フラッシュカードの3タブ）
- `css/style.css`: スタイル
- `js/storage.js`: localStorageへの読み書き
- `js/translate.js`: MyMemory Translation APIを使った英日翻訳
- `js/speech.js`: Web Speech APIを使った読み上げ
- `js/app.js`: 画面の描画とイベント処理
