# PDF生成ライブラリ（pdfkit）のインストール

領収書ダウンロード機能を使用するには、`pdfkit`ライブラリをインストールする必要があります。

## インストール方法

バックエンドディレクトリで以下のコマンドを実行してください：

```bash
cd "C:\Users\谷口 梓\Desktop\kajishift-backend"
npm install pdfkit
```

または、PowerShellで日本語パスが問題になる場合は、以下のように実行してください：

```powershell
Set-Location "C:\Users\谷口 梓\Desktop\kajishift-backend"
npm install pdfkit
```

## インストール後の確認

インストールが完了したら、`package.json`の`dependencies`に`pdfkit`が追加されていることを確認してください。

## 使用方法

領収書ダウンロードAPIは以下のエンドポイントで利用できます：

- `GET /api/payments/:id/receipt` - 領収書PDFをダウンロード

フロントエンドからは`api.downloadReceipt(paymentId)`メソッドを使用して領収書をダウンロードできます。

## 日本語フォント（Noto Sans JP）

PDFKit の標準フォント（Helvetica 等）では日本語が表示できないため、**Noto Sans JP** の OpenType フォントをプロジェクトに同梱し、`src/services/receiptService.js` で `registerFont` してから描画しています。

| ファイル | 用途 |
|----------|------|
| `assets/fonts/NotoSansJP-Regular.otf` | 本文・ラベル |
| `assets/fonts/NotoSansJP-Bold.otf` | 見出し・強調 |

- フォントは [noto-cjk](https://github.com/googlefonts/noto-cjk) の日本語サブセット（SIL Open Font License）です。
- パスは `receiptService.js` 内で `path.join(__dirname, '..', '..', 'assets', 'fonts', ...)` として解決されるため、**リポジトリルートからの相対配置**を崩さないでください。
- **Railway / Docker** などでは、ビルド成果物に `assets/fonts/*.otf` が含まれること（`.dockerignore` で除外していないこと等）を確認してください。欠落時は実行時に「日本語フォントが見つかりません」エラーになります。
- 手元でファイルを再取得する例（プロジェクトルートで実行）:

```powershell
New-Item -ItemType Directory -Force -Path "assets\fonts" | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf" -OutFile "assets\fonts\NotoSansJP-Regular.otf" -UseBasicParsing
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Bold.otf" -OutFile "assets\fonts\NotoSansJP-Bold.otf" -UseBasicParsing
```
