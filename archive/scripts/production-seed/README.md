# 本番seedスクリプトアーカイブ

このフォルダは、過去に本番DBへseedデータを投入するために用意されたスクリプトを参照用に残す場所です。

現在のβ運用では、Production DBで `npm run seed` を実行しません。βユーザーは招待制で作成し、初期パスワードは個別に強い値を発行します。

## 保管しているファイル

| ファイル | 内容 | 現在の扱い |
|---|---|---|
| `seed-production.ps1` | PowerShell向け本番seed投入スクリプト | 参照専用・実行禁止 |
| `seed-production-simple.ps1` | PowerShell向け簡易本番seed投入スクリプト | 参照専用・実行禁止 |
| `seed-production.sh` | Git Bash向け本番seed投入スクリプト | 参照専用・実行禁止 |
| `seed-production-env.js` | Node.js向け本番seed投入スクリプト | 参照専用・実行禁止 |

## 現在参照する資料

- 本番seed禁止: [docs/BETA_OPERATIONS_RUNBOOK.md](../../../docs/BETA_OPERATIONS_RUNBOOK.md)
- ローカルテストデータ: [docs/README_SEED.md](../../../docs/README_SEED.md)
- 非破壊ローカルE2E seed: [docs/LOCAL_E2E_CHECK.md](../../../docs/LOCAL_E2E_CHECK.md)

## 注意

- このフォルダ内のスクリプトは、既存データを削除する `npm run seed` を実行します。
- 本番DB、検証DB、共有DBに対して実行しないでください。
- どうしてもseedが必要な場合は、実行前にDB種別、バックアップ、復元手順、責任者、承認者を別途確認してください。
