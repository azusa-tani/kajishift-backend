# 参照専用資料の案内

このフォルダは、過去の経緯や判断を残すための案内です。

過去資料の本文はこの `archive/` 配下に移動しています。各資料の先頭にある「参照専用」表示を確認し、現在の手順には使わないでください。

## 参照専用の資料

| 資料 | 現在の手順に使わない理由 | 代わりに参照する資料 |
|---|---|---|
| `RENDER_DEPLOYMENT.md` | 現行本番環境はRenderではなくRailway | `../DEPLOYMENT.md`、`../BETA_OPERATIONS_RUNBOOK.md` |
| `TODAY_TASKS.md` | 2026-03-02時点の作業メモ | `../RELEASE_READINESS_CHECKLIST.md` |
| `PRODUCTION_LAUNCH_TASKS.md` | Stripe未導入・Render前提など、現在と異なる内容を含む | `../RELEASE_READINESS_CHECKLIST.md` |
| `REMAINING_TASKS.md` | 2026-02時点の実装状況 | `../FEATURE_LIST.md`、`../INTEGRATION_STATUS.md` |
| `HANDOVER_COMPLETE.md` | 2026-02時点の引継ぎ完了記録 | `../../README.md`、`../FRONTEND_INTEGRATION.md` |
| `HANDOVER_PROMPT.md` | 初期の引継ぎ用プロンプト | `../../README.md`、`../FRONTEND_INTEGRATION.md` |
| `api-design.md` | 初期API設計であり、現行APIと一部異なる | `../FRONTEND_INTEGRATION.md`、Swagger注釈 |
| `SEED_PRODUCTION.md` | 現行方針では本番seedを禁止している | `../BETA_OPERATIONS_RUNBOOK.md` |
| `DOMAIN_AND_ADMIN_API_PROTECTION_PLAN.md` | Cloudflare方針資料の旧版 | `../CLOUDFLARE_DOMAIN_ADMIN_PROTECTION_PLAN.md`、`../CLOUDFLARE_DOMAIN_IMPLEMENTATION_RUNBOOK.md` |

## 参照専用のインフラ設定

| 資料 | 現在の手順に使わない理由 | 保管場所 |
|---|---|---|
| `render.yaml` | 現行本番環境はRenderではなくRailway | `../../archive/infrastructure/render/render.yaml` |
| `RENDER_ENV_TEMPLATE.md` | Render向け環境変数テンプレートのため | `../../archive/infrastructure/render/RENDER_ENV_TEMPLATE.md` |

## 参照専用のスクリプト

| 資料 | 現在の手順に使わない理由 | 保管場所 |
|---|---|---|
| `seed-production.ps1` | 現行方針では本番seedを禁止している | `../../archive/scripts/production-seed/seed-production.ps1` |
| `seed-production-simple.ps1` | 現行方針では本番seedを禁止している | `../../archive/scripts/production-seed/seed-production-simple.ps1` |
| `seed-production.sh` | 現行方針では本番seedを禁止している | `../../archive/scripts/production-seed/seed-production.sh` |
| `seed-production-env.js` | 現行方針では本番seedを禁止している | `../../archive/scripts/production-seed/seed-production-env.js` |

資料を削除する場合は、参照元・Git履歴・運用上の保存要件を別途確認してから判断してください。
