# Render設定アーカイブ

このフォルダは、過去にRender向けに使っていた設定ファイルを参照用に残す場所です。

現在の本番BackendはRailwayで運用しているため、このフォルダ内の設定を現在のデプロイ手順として使わないでください。

## 保管しているファイル

| ファイル | 内容 | 現在の扱い |
|---|---|---|
| `render.yaml` | Render Web Service / PostgreSQL の設定例 | 参照専用 |
| `RENDER_ENV_TEMPLATE.md` | Render向け環境変数テンプレート | 参照専用 |

## 現在参照する資料

- 現行資料の入口: [docs/README.md](../../../docs/README.md)
- β運用・停止復旧: [docs/BETA_OPERATIONS_RUNBOOK.md](../../../docs/BETA_OPERATIONS_RUNBOOK.md)
- デプロイ関連: [docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md)
- リリース準備: [docs/RELEASE_READINESS_CHECKLIST.md](../../../docs/RELEASE_READINESS_CHECKLIST.md)

## 注意

- Renderを再利用する場合は、Railway運用との差分、環境変数、DB、CORS、Webhook、バックアップ方針を再確認してください。
- このフォルダのファイルは削除せず、過去の判断や設定の履歴として保持しています。
