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
