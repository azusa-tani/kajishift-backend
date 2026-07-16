# KAJISHIFT ドキュメント案内

最終整理: 2026-07-16

このファイルは、現在の運用で参照する資料と、過去の経緯を残す資料を分けるための目次です。

## 最初に確認する資料

| 目的 | 参照する資料 |
|---|---|
| 日常運用・障害対応・停止と復旧 | [BETA_OPERATIONS_RUNBOOK.md](./BETA_OPERATIONS_RUNBOOK.md) |
| A案/B案の公開判断 | [RELEASE_READINESS_CHECKLIST.md](./RELEASE_READINESS_CHECKLIST.md) |
| 公開判断の実施結果・証跡 | [BETA_EXECUTION_RESULT.md](./BETA_EXECUTION_RESULT.md) |
| Cloudflare・独自ドメイン・管理画面保護 | [CLOUDFLARE_DOMAIN_IMPLEMENTATION_RUNBOOK.md](./CLOUDFLARE_DOMAIN_IMPLEMENTATION_RUNBOOK.md) |
| フロントエンドとバックエンドのAPI連携 | [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) |
| ローカル開発用DBの準備 | [DATABASE_SETUP.md](./DATABASE_SETUP.md) |
| ローカルのテストデータ | [README_SEED.md](./README_SEED.md) |
| ローカルE2E確認 | [LOCAL_E2E_CHECK.md](./LOCAL_E2E_CHECK.md) |

## 現在の運用前提

- BackendはRailway、FrontendはVercelを利用する。
- A案は「本番決済なし限定公開」である。
- 本番DBで `npm run seed` は実行しない。詳細は [BETA_OPERATIONS_RUNBOOK.md](./BETA_OPERATIONS_RUNBOOK.md) を優先する。
- API仕様は [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) と実装上のSwagger注釈を優先する。

## 過去資料・参照専用資料

次の資料は削除せず [archive/](./archive/) に移動しました。現在の作業手順として使わないでください。理由は [archive/README.md](./archive/README.md) を参照してください。

- [RENDER_DEPLOYMENT.md](./archive/RENDER_DEPLOYMENT.md)
- [TODAY_TASKS.md](./archive/TODAY_TASKS.md)
- [PRODUCTION_LAUNCH_TASKS.md](./archive/PRODUCTION_LAUNCH_TASKS.md)
- [REMAINING_TASKS.md](./archive/REMAINING_TASKS.md)
- [HANDOVER_COMPLETE.md](./archive/HANDOVER_COMPLETE.md)
- [HANDOVER_PROMPT.md](./archive/HANDOVER_PROMPT.md)
- [api-design.md](./archive/api-design.md)
- [SEED_PRODUCTION.md](./archive/SEED_PRODUCTION.md)
- [DOMAIN_AND_ADMIN_API_PROTECTION_PLAN.md](./archive/DOMAIN_AND_ADMIN_API_PROTECTION_PLAN.md)

Render用の設定ファイルは、実行対象にならないように [archive/infrastructure/render/](../archive/infrastructure/render/) へ移動しました。
本番seed用の過去スクリプトは、実行対象にならないように [archive/scripts/production-seed/](../archive/scripts/production-seed/) へ移動しました。

## 補足

- `BETA_RELEASE_FINAL_CHECKLIST.md`、`BETA_RELEASE_GONOGO_CHECKLIST.md`、`A_PLAN_PRE_RELEASE_CHECKLIST.md` は、過去の公開判断と証跡として保持する。
- `CLOUDFLARE_DOMAIN_ADMIN_PROTECTION_PLAN.md`、`CLOUDFLARE_DOMAIN_ADMIN_GONOGO_DECISION.md`、`CLOUDFLARE_DOMAIN_IMPLEMENTATION_RUNBOOK.md` は、方針・判断・手順の役割が異なるため、すべて保持する。
