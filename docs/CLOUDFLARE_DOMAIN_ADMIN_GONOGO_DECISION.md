# Cloudflare・独自ドメイン・管理保護 Go/No-Go判断準備

最終更新: 2026-07-09  
確認者: `KAJISHIFT運用担当`

このドキュメントは、`docs/CLOUDFLARE_DOMAIN_ADMIN_PROTECTION_PLAN.md` をもとに、Cloudflare、独自ドメイン、管理画面保護、管理API保護の実操作前Go/No-Go判断材料を整理する。

このドキュメントでは、Cloudflare操作、DNS変更、Vercel設定変更、Railway設定変更、Stripe操作、DB操作、Webhook再送、管理画面操作、実装コード変更、commit、push、deployを行わない。

実URL、個人情報、メールアドレス、電話番号、住所、問い合わせ本文、フォーム回答本文、審査回答本文、問い合わせID、userId風の値、workerId、bookingId、予約ID、submissionId、APIキー、Secret、DB接続文字列、決済情報の実値は記録しない。

## 1. 参照した現行構成

Backend:

- `src/index.js` で `CORS_ORIGIN` をカンマ区切りで読み、許可Origin方式でCORSを判定している。
- `src/config/socket.js` でSocket.io CORSも `CORS_ORIGIN` を参照している。
- `src/index.js` で `/api/public`、`/api/auth`、`/api/admin`、`/api/webhooks` などを分離している。
- `src/routes/admin.js` で `/api/admin/*` はJWT認証とADMINロール認可を共通適用している。
- `src/routes/admin.js` で、運用復旧系を除く管理更新系は `adminWrite` の運用ガード対象になっている。
- 現時点で、Cloudflare Access認証済み性をBackendで検証する実装や、Railway直URLからの管理API直叩きを専用に拒否する実装は確認していない。

Frontend:

- Frontendは `admin/`、`customer/`、`worker/` のディレクトリで画面が分かれている。
- 管理画面は `admin/` 配下にまとまっているため、Cloudflare Access対象を `/admin/*` に限定しやすい。
- 管理者ログイン画面も `admin/` 配下にあるため、`/admin/*` 全体をAccess対象にするとログイン画面も保護対象になる。
- 一般ユーザー向けトップ、問い合わせ、事前登録、β利用希望、依頼者画面、ワーカー画面は `admin/` 配下ではないため、Access対象を `/admin/*` に限定すれば直接の対象外にできる。
- `js/config.js` は、ローカル以外のFrontendでは本番Backend公開先をAPI / Socket接続先にする構成である。
- `js/api.js` と `js/socket.js` は、`window.API_BASE_URL` と `window.SOCKET_SERVER_URL` がある場合はそれを優先する。
- Service Workerは `js/api.js`、`js/config.js`、`service-worker.js` をno-store扱いにしており、API / Socket接続先変更時の古い設定残りを抑える設計がある。

## 2. 正規URL方針の判断材料

推奨:

- A案では、正規URLは **wwwなし** を第一候補にする。
- wwwありは非正規URLとして扱い、正規URLへリダイレクトする。
- リダイレクト責任範囲は **Cloudflare側に寄せる**。
- 一般ユーザー向けURL、アプリ本体URL、管理画面URLは、A案では同一ドメイン配下で始める。
- 管理画面は同一ドメイン配下の `/admin/*` とし、管理専用サブドメインはA案では保留する。

理由:

- wwwなしは利用者案内、SNSプロフィール、法務ページ、Stripe審査向け説明で短く扱いやすい。
- CloudflareをDNS管理と入口制御の中心にするなら、wwwあり / なしの正規化もCloudflare側に寄せたほうが責任範囲を説明しやすい。
- Vercel側にもリダイレクト責任を持たせると、Cloudflare側のルールと重複してリダイレクトループや切り戻し時の混乱が起きやすい。
- A案は本番決済なし限定公開であり、構成を分けすぎるより、現行構成に近い形で影響範囲を小さくするほうが安全。
- 管理専用サブドメインは将来的に有効だが、DNS、Vercel、Access、CORS、Cookie、切り戻しの確認点が増えるため、A案では過剰になりやすい。

未決事項:

- 正規URLをwwwなしで確定するか。
- wwwありからwwwなしへのリダイレクトをCloudflare側だけで担うか。
- リダイレクトを設定する前に、既存Production Aliasを切り戻し先としてどう案内するか。
- HSTSを初回から有効化しない方針でよいか。

## 3. Cloudflare Access対象パスの判断材料

推奨:

- A案では、Cloudflare Access対象を `/admin/*` 全体に限定する。
- 管理者ログイン画面もAccess対象に含める。
- 一般ユーザー画面、依頼者画面、ワーカー画面、問い合わせ、事前登録、β利用希望、サイト確認モニター導線はAccess対象外にする。

理由:

- 管理者ログイン画面も `admin/` 配下にあるため、`/admin/*` 全体保護で入口から隠しやすい。
- 未許可ユーザーが管理者ログイン画面へ到達しないため、ログインUI露出、ログイン試行、管理画面URL推測のリスクを下げられる。
- Stripe審査準備でも、管理画面がMFA付きAccessで保護されている方針を説明しやすい。
- Frontendの主要導線は `admin/` 配下ではないため、Access対象パスを誤らなければ一般導線への影響は限定できる。

影響:

- Access設定ミスがあると、管理者自身もログイン画面に入れなくなる可能性がある。
- 管理者ログイン画面に含まれる共通JSやCSSは `admin/` 外の相対パスも参照するため、静的アセットまでAccess対象に含める必要はない。
- フッターなどに管理者リンクが表示される画面があるため、未許可ユーザーがリンクを押した場合はAccess側で拒否される挙動になる。

未決事項:

- Access許可対象者の範囲。
- 認証方式をメール認証、Googleログイン、MFAのどれにするか。
- 管理者本人がAccessに入れなくなった場合の戻し手順。
- `/admin/*` 以外を誤って対象にしないための設定レビュー方法。

## 4. CORS / Socket.io CORS変更要否

Backendの `CORS_ORIGIN`:

- 独自ドメインでFrontendを公開する場合、独自ドメインのOriginを許可する必要がある。
- 既存Production Aliasを切り戻し先として維持する場合、既存Production AliasのOriginも引き続き許可する必要がある。
- 現行Backendは複数Originをカンマ区切りで扱えるため、設計上は独自ドメインと既存Production Aliasの併用に対応しやすい。
- 実際の環境変数変更は今回行わない。

Socket.io CORS:

- `src/config/socket.js` も `CORS_ORIGIN` を参照しているため、APIのCORSと同じOrigin整理が必要。
- 独自ドメインでログイン後画面や通知を確認する場合、Socket.io接続元として独自ドメインOriginを許可する必要がある。
- 既存Production Aliasを切り戻し先に残す場合、Socket.io側でも既存Production Aliasを許可したままにする必要がある。

Frontend側のAPI参照先:

- 現行Frontendは、ローカル以外では本番Backend公開先へ接続する設定になっている。
- Backend APIを独自ドメイン化しない場合、Frontend側のAPI参照先変更はA案では必須ではない可能性がある。
- Backend APIも独自ドメイン化する場合、`js/config.js` のAPI / Socket接続先の見直しが必要になる。
- `window.API_BASE_URL` と `window.SOCKET_SERVER_URL` が優先されるため、将来の切替方法はFrontend設定と環境運用のどちらに寄せるか判断が必要。

既存Production Aliasを残す場合の注意:

- 独自ドメインと既存Production Aliasの両方からFrontendを開ける期間は、Backend CORSとSocket.io CORSに両方を含める。
- どちらか一方だけを許可すると、もう一方でAPIまたはSocketが失敗する。
- Service Workerやブラウザキャッシュにより古い `js/config.js` が残らないか、切替後にno-store対象が効いていることを確認する。

未決事項:

- Backend APIを独自ドメイン化するか、当面Backend公開先を継続するか。
- 独自ドメインと既存Production Aliasの併用期間を設けるか。
- `CORS_ORIGIN` に追加するOriginの抽象案。
- Socket.io接続先を独自ドメイン化するか。

## 5. Railway直URLリスクの判断材料

推奨:

- A案中はRailway直URLリスクを残リスクとして許容する。
- B案移行前に `/api/admin/*` の追加保護を必須判断にする。
- Cloudflare AccessだけではBackend直URL対策にならないことを明記して運用する。

A案中に許容する条件:

- 管理画面更新系操作を行わない。
- `/api/admin/*` の現行JWT認証、ADMINロール認可、運用ガードを維持する。
- 管理者トークンを厳格に管理し、共有範囲を最小化する。
- 管理API、公開API、Webhook、監視、Frontend接続の切り分けが未整理のままRailway直URLを塞がない。
- B案移行前のGo/No-Goで追加保護を必ず再判断する。

B案前に必須判断とする理由:

- 本番決済、本番カード登録、正式予約、管理更新系操作に近づくほど、管理API直叩きの影響が大きくなる。
- 管理者トークン漏えい時、JWTとADMINロールだけではトークン有効期間中の直叩きを止めにくい。
- CSV / Excel出力、承認/却下、削除、設定更新などは個人情報や運用状態への影響が大きい。
- Stripe審査準備や正式運用では、管理画面だけでなく管理APIの保護方針を説明できる必要がある。

注意点:

- `/api/admin/*` だけを追加保護し、`/api/public/*`、`/api/health`、`/api/auth/*`、customer向けAPI、worker向けAPI、`/api/webhooks/*` を巻き込まない。
- Webhookは外部サービスから直接到達する必要があるため、Cloudflare Access対象にしない。
- 公開status APIやヘルスチェックは、Frontend表示や監視に必要な最小情報だけを返す。
- Cloudflare Access認証済みヘッダーをBackendで要求する場合は、ヘッダー偽装対策と直URL到達時の拒否仕様を設計する。

## 6. Go/No-Go判断表

| 判断項目 | 推奨案 | 理由 | A案で対応するか | B案前に対応するか | No-Go条件 | 未決事項 |
|----------|--------|------|-----------------|-------------------|------------|----------|
| 正規URL | wwwなしを第一候補 | 短く案内しやすく、公式URLとして扱いやすい | 判断のみ。実設定はしない | 必要に応じて再確認 | 正規URLが未確定 | 最終的にwwwあり / なしのどちらを採用するか |
| wwwあり / なし | wwwなしを正規、wwwありはリダイレクト | URL表記を1つに統一できる | 判断のみ | 正式公開前に再確認 | 両方が正規扱いで残る | リダイレクト開始日と確認手順 |
| リダイレクト責任範囲 | Cloudflare側へ寄せる | DNS入口とURL正規化を同じ責任範囲にできる | 判断のみ | 必要に応じて再確認 | CloudflareとVercel双方で競合する | Vercel側のリダイレクト設定有無 |
| Cloudflare Access対象パス | `/admin/*` のみ | Frontend構成上、管理画面を限定しやすい | 実操作前判断のみ | B案前にも維持確認 | 一般導線までAccess対象になる | 対象パスの最終設定案 |
| 管理者ログイン画面をAccess対象に含めるか | 含める | ログイン画面の露出を抑え、審査準備の説明もしやすい | 実操作前判断のみ | 必須 | ログイン画面が未保護で公開される | 管理者が入れない場合の戻し手順 |
| CORS変更要否 | 独自ドメイン公開時は変更要否あり | 新しいFrontend Originを許可する必要がある | 実変更はしない | 必須確認 | 独自ドメインでAPIがCORS失敗する | 独自ドメインと既存Production Aliasの併用期間 |
| Socket.io CORS変更要否 | API CORSと同様に確認必須 | `CORS_ORIGIN` をSocket.ioも参照している | 実変更はしない | 必須確認 | 独自ドメインでSocket接続できない | Socket接続先を独自ドメイン化するか |
| 既存Production Aliasの維持 | 切り戻し先として維持 | 初回独自ドメイン公開時の戻し先になる | 維持前提で判断 | 正式移行時に再判断 | 切り戻し先が未整理 | いつまで併用するか |
| Railway直URLリスク | A案中は残リスク管理 | 急に塞ぐと公開APIやWebhookへ影響し得る | 許容。ただし条件付き | 必須判断 | 管理更新系開始前に未判断 | 追加保護の方式 |
| `/api/admin/*` 追加保護 | A案では保留、B案前に必須判断 | 現行認証はあるが直URL対策は未実装 | 実装しない | 必須 | B案前に保護方針が未確定 | Access認証済みヘッダー検証か別方式か |
| 管理専用サブドメイン | A案では保留 | 初期公開の確認点が増える | 保留 | 必要に応じて判断 | サブドメイン分離が未整理のままAccessを複雑化 | 正式運用で分離するか |
| Stripe審査向け証跡化 | 抽象情報で記録 | 実URLや個人情報を残さず、保護方針を説明する | 方針整理のみ | 必須 | 実値やSecret類が資料に混入 | 証跡テンプレートの置き場 |

## 7. A案での推奨判断

- 正規URLはwwwなしを第一候補にする。
- wwwありは非正規URLとして、Cloudflare側で正規URLへリダイレクトする方針にする。
- 一般ユーザー向けURL、アプリ本体URL、管理画面URLは同一ドメイン配下で始める。
- 管理画面は `/admin/*` 全体をCloudflare Access対象にする。
- 管理者ログイン画面もAccess対象に含める。
- 管理専用サブドメインはA案では保留する。
- Backend APIは当面現行Backend公開先を使う前提で、Frontend独自ドメインのCORS追加要否を判断する。
- Socket.io CORSもBackend CORSと同じOrigin整理を行う。
- Railway直URLはA案中は残リスクとして管理する。
- `/api/admin/*` 追加保護はA案中には実装せず、B案前の必須判断にする。

## 8. B案前に必須判断とすべき項目

- `/api/admin/*` にCloudflare Access認証済み性またはCloudflare経由性確認を追加するか。
- Railway直URLからの管理API直叩きをどう拒否または抑止するか。
- 管理者MFAをCloudflare Access側で必須にするか、アプリ側にも実装するか。
- 管理者ログイン失敗時のアカウントロックをどう扱うか。
- CSV / Excel出力、承認/却下、削除、設定更新などの管理更新系操作をいつ解禁するか。
- Backend APIやSocket接続先を独自ドメイン化するか。
- 既存Production Aliasをいつまで切り戻し先として維持するか。
- Stripe審査向け証跡を、実値なしでどのdocsに記録するか。

## 9. 今回行わないこと

- Cloudflare操作
- DNS変更
- Vercel設定変更
- Railway設定変更
- Stripe操作
- DB操作
- Webhook再送
- 管理画面操作
- 実装コード変更
- deploy
- commit
- push
