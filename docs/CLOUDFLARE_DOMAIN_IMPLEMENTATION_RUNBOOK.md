# Cloudflare・独自ドメイン 実操作前Runbook

最終更新: 2026-07-29
確認者: `KAJISHIFT運用担当`

このRunbookは、A案「本番決済なし限定公開」中に、Cloudflare、DNS、Vercel、管理画面保護の実操作へ進む前に確認すべき項目、手順案、戻し手順、Go/No-Go条件を整理する。

このRunbookでは、Cloudflareへのドメイン追加、Nameserver変更、DNS変更、Redirect Rule作成、Zero Trust / Access設定、Vercel独自ドメイン追加、Railway設定変更、CORS環境変数変更、Frontend設定変更、実装コード変更、Stripe操作、DB操作、Webhook再送、管理画面操作、deploy、commit、pushを行わない。

実URL、ドメインのDNS実値、Nameserver実値、メールアドレス、個人情報、ID類、APIキー、Secret、DB接続文字列、決済情報、CloudflareやVercelのアカウント情報は記録しない。

## 1. 目的・前提

目的:

- A案で確定したCloudflare / 独自ドメイン / 管理画面保護方針を、実操作前に安全に実施できる手順へ落とし込む。
- Cloudflare、DNS、Vercel、Backend CORS、Socket.io CORS、Service Worker、管理画面Access保護の影響範囲を整理する。
- 実操作前に、Go/No-Goを判断できる状態にする。

前提:

- A案の公開範囲は、問い合わせ、事前登録、β利用希望、サービス内容閲覧、サイト確認モニターからのフィードバック受付に限定する。
- 正式予約、本番決済、本番カード登録、worker受注、管理更新系操作は開始しない。
- 既存Production Aliasは、独自ドメイン公開後も当面の切り戻し先として維持する。
- Railway直URLはA案中は残リスクとして管理し、B案前に再判断する。
- `/api/admin/*` の追加保護はA案中には実装せず、B案移行前の必須判断とする。

## 2. A案確定方針

- 正規URLはwwwなしとする。
- wwwありはCloudflare側で正規URLへリダイレクトする。
- 一般ユーザー向けURL、アプリ本体、管理画面は同一ドメイン配下で開始する。
- 管理画面は `/admin/*` とする。
- Cloudflare Accessは `/admin/*` 全体を対象とする。
- 管理者ログイン画面もCloudflare Access対象に含める。
- 一般画面、依頼者画面、ワーカー画面、問い合わせ、事前登録、β利用希望、サイト確認モニター導線はAccess対象外とする。
- 既存Production Aliasは当面の切り戻し先として維持する。
- Railway直URLはA案中は残リスク管理とする。
- `/api/admin/*` の追加保護はB案前の必須判断とする。
- CORS / Socket.io CORSは独自ドメイン公開前に変更要否を確認する。
- HSTSは初回独自ドメイン公開時には有効化しない。
- A案の公開範囲は変更しない。

## 3. 実操作前に手動確認する項目

リポジトリ内の確認結果:

- Backend側にはCloudflare / 独自ドメイン / 管理保護方針docsが存在する。
- このリポジトリはBackendであり、Frontend実体（`admin/`、`js/`、`vercel.json`、CSS、画像、フォント）は含まれない。Frontendのファイル構成は `docs/FRONTEND_INTEGRATION.md`、`docs/BETA_EXECUTION_RESULT.md` などの既存記録に基づくため、実設定前にFrontendリポジトリまたはVercelの現行Deploymentで再確認する。
- 既存記録では、FrontendのAPI / Socket接続先は `js/config.js`、`js/api.js`、`js/socket.js` で管理され、`window.API_BASE_URL` と `window.SOCKET_SERVER_URL` が優先される。
- 既存資料では、FrontendはVercel静的配信用の `vercel.json` を持ち、旧Netlify向け `_redirects` と `netlify.toml` も残ると記録されている。これらの実体はBackendリポジトリ外のため、現行運用で有効なredirect、rewrite、headersはFrontendリポジトリまたはVercelで確認する。
- BackendのREST API CORSは `CORS_ORIGIN` をカンマ区切りで読み、許可Origin方式で判定している。
- Socket.io CORSも `CORS_ORIGIN` を参照している。
- 既存記録ではService Workerは `js/api.js`、`js/config.js`、`service-worker.js` をno-store扱いとし、管理画面は `admin/`、依頼者画面は `customer/`、ワーカー画面は `worker/` に分離されている。Access設定前後に、実際のHTMLが参照する `/admin/` 外のJS/CSS/画像/フォントをNetworkで確認する。

ドメイン・DNS:

- 現在のドメイン管理会社。
- 現在のNameserver。
- DNSレコードの種類。
- ルートドメインとwwwの現在の向き先。
- MX、TXT、SPF、DKIM、DMARCなどメール関連レコードの有無。
- 他サービスで利用中のサブドメイン。
- Nameserver変更時に影響する範囲。
- DNS変更前に取得すべき証跡。

Cloudflare:

- 対象ドメインがCloudflareに追加済みか。
- 現在のプラン。
- DNS管理状態。
- Proxyの有効 / 無効状態。
- SSL/TLSモード。
- Redirect Rulesの現状。
- Zero Trust / Accessの利用可否。
- Accessに利用する認証方式候補。
- MFAを必須にできるか。
- `/admin/*` だけを対象にできるか。
- 戻し手順として必要な設定情報。
- Access Applicationの対象ホスト（要管理画面確認）とパスが `/admin/*` だけであること。`/api/*`、`/uploads/*`、`/socket.io/*`、`/` は対象に含めない。
- 対象ホストのDNS Proxy状態（橙雲 / DNS only）と、Vercelが指定するDNSレコードの組合せ。
- SSL/TLSモード、Edge証明書の有効性、Vercel側証明書の発行状態。実値・推奨値は対象ドメインとVercelの案内を確認してから決める。
- Accessで使用するIdentity Provider（要管理画面確認）、許可対象者の最小集合（メール実値は記録しない）、MFAをどのIdentity Provider設定で強制するか。

Vercel:

- 対象Frontendプロジェクト。
- 現在のProduction Alias。
- 独自ドメイン登録状況。
- ルートドメインとwwwの設定方法。
- CloudflareをDNSとして使う場合の必要レコード。
- Vercel側に既存のredirect設定がないか。
- SSL証明書発行への影響。
- 独自ドメイン追加後もProduction Aliasが利用できるか。
- 切り戻し時の操作候補。
- `vercel.json`、Project Domains、Redirects、Deploymentsに、wwwありからwwwなしへのCloudflare Redirect Ruleと競合する設定がないこと。
- 管理画面のHTMLが参照する共通静的アセットと、Access適用後もそれらが取得できること。

## 4. 変更前証跡一覧

実操作前に、以下の証跡を取得する。証跡には実URL、DNS実値、Nameserver実値、メールアドレス、ID類、Secret類を含めない公開用要約と、内部保管用の原本を分ける。

docsへ記録してよい要約:

- 確認日。
- 確認者 `KAJISHIFT運用担当`。
- 対象サービス名の抽象表記。
- 設定が存在する / 存在しない。
- レコード種別の有無。
- Proxyが有効 / 無効。
- SSL/TLSモードの確認済みステータス。
- Access利用可否。
- Production Aliasが切り戻し先として利用可能であること。
- Access Applicationの対象ホスト・パスが `/admin/*` のみである確認結果、Identity Provider / MFA強制方式の確認済み状態、Allowポリシーの最小人数化、未許可ユーザー拒否の確認結果。

内部保管する証跡:

- DNSレコード一覧。
- Nameserver一覧。
- メール関連DNSレコード。
- Cloudflare DNS / SSL / Redirect / Access設定画面。
- Vercel Domains / Production / Deployments設定画面。
- Railway VariablesのCORS関連設定。
- Frontend配信設定、Service Worker、API / Socket接続先の確認結果。
- 設定前後のBrowser DevTools Network（Access拒否、許可後のHTML、`/admin/` 外アセット、API、Socket.io）の画面。個人情報、トークン、Cookie、ID、Secretはマスクする。

## 5. 推奨実施順序

1. 現状確認。
2. 変更前証跡取得。
3. DNSレコード退避。
4. Cloudflare追加準備。
5. Vercel独自ドメイン追加準備。
6. CORS / Socket.io CORS変更要否判断。
7. 実操作前Go/No-Go。
8. Goの場合のみDNS / Vercel設定。
9. 正規URL・リダイレクト確認。
10. 一般導線確認。
11. `/admin/*` Cloudflare Access設定。
12. 許可ユーザー・未許可ユーザー確認。
13. 独自ドメインでのAPI / Socket確認。
14. 既存Production Aliasでの切り戻し確認。
15. 証跡・実施結果記録。

## 6. Cloudflare追加・DNS移行手順案

事前確認:

- Cloudflareに対象ドメインを追加する権限がある。
- 現在のドメイン管理会社にログインできる。
- 現在のNameserver、DNSレコード、メール関連レコード、利用中サブドメインを確認済み。
- 変更前DNSレコードを退避済み。
- メール関連DNSの影響を確認済み。

手順案:

1. Cloudflareに対象ドメインを追加する。
2. Cloudflareが検出したDNSレコードを確認する。
3. 変更前DNSレコードとCloudflare側DNSレコードを照合する。
4. 不足するレコードがあれば、実操作前Go/No-Go前に追加案を整理する。
5. Proxyを有効にするレコード、DNS onlyにするレコードを分類する。
6. メール関連レコードは原則DNS onlyで扱う。
7. Nameserver変更手順、反映時間、戻し手順を確認する。
8. Goの場合のみNameserver変更へ進む。

注意:

- DNSレコードの実値はdocsに記録しない。
- メール関連レコードの削除や変更はNo-Go。
- 他サービスで利用中のサブドメインの影響が不明な場合はNo-Go。

## 7. Vercel独自ドメイン追加手順案

事前確認:

- 対象Frontendプロジェクトを確認する。
- 現在のProduction Aliasを確認する。
- `vercel.json` に独自ドメイン向けのredirect、rewrite、headersがないことを確認する。
- 既存Production Aliasを切り戻し先として維持できることを確認する。
- CloudflareをDNSとして使う場合の必要レコードをVercel側で確認する。

手順案:

1. Vercelの対象Frontendプロジェクトを開く。
2. Domains設定で、ルートドメインとwwwの扱いを確認する。
3. wwwなしを正規として登録する準備をする。
4. wwwありは非正規として扱い、Cloudflare側リダイレクトに寄せる方針を確認する。
5. Vercel側で自動リダイレクトや競合する設定がないか確認する。
6. SSL証明書発行の状態と反映待ち条件を確認する。
7. Goの場合のみVercel独自ドメイン追加へ進む。

注意:

- Vercel個別Deployment URLや実URLはdocsに記録しない。
- Vercel側とCloudflare側でリダイレクト責任が重複する場合はNo-Go。

## 8. wwwありからwwwなしへのリダイレクト手順案

事前確認:

- wwwなしを正規URLとして確定済み。
- wwwありのDNSがCloudflareで管理される。
- Cloudflare側でRedirect Ruleが利用できる。
- Vercel側に競合するリダイレクトがない。
- HSTSは初回では有効化しない。

手順案:

1. Cloudflare Redirect Rulesで、wwwありからwwwなしへ転送するルール案を作成する。
2. 対象をwwwありのみに限定する。
3. パスとクエリを維持するか確認する。
4. ループしない条件を設定する。
5. ルール適用前にGo/No-Goを確認する。
6. Goの場合のみRedirect Ruleを有効化する。

確認:

- wwwありからwwwなしへ1回でリダイレクトされる。
- wwwなしへ直接アクセスした場合にリダイレクトループしない。
- HTTPSで表示できる。
- Service Workerやキャッシュの影響がない。

## 9. Cloudflare Access `/admin/*` 設定手順案

事前確認:

- Cloudflare Zero Trust / Accessが利用できる。
- Access Applicationの対象ホストは、wwwなしの正規Frontendホスト（実FQDNは**要管理画面確認**）に限定する。
- Access対象は `/admin/*` 全体に限定する。
- 管理者ログイン画面もAccess対象に含める。
- 一般画面、依頼者画面、ワーカー画面、問い合わせ、事前登録、β利用希望、サイト確認モニター導線は対象外にする。
- `/api/*`、`/uploads/*`、`/socket.io/*`、WebhookやAPI全体をAccess対象にしない。現行APIとSocket.ioはRailway直URLへ接続する。
- Allowポリシーは、管理作業に必要な最小人数の許可対象者だけを対象にする。許可対象のメール実値はdocsに記録しない。
- Identity Providerは**要管理画面確認**。メールワンタイムコードをMFAと同一視せず、選定したIdentity Provider側でMFAを必須化できること、またはAccessで要求するMFA条件を事前に確認する。
- 許可ユーザー、未許可ユーザー、既存のADMINロールを持つアプリ利用者の各確認方法を決める。
- 管理者本人が入れなくなった場合、Cloudflare権限を持つ別担当者がAccess ApplicationまたはAllowポリシーを無効化できることを確認する。単独担当者しか復旧できない状態はNo-Goとする。
- FrontendリポジトリまたはVercelの現行Deploymentで、`/admin/*` のHTMLが参照する `/admin/` 外のJS、CSS、画像、フォント、Service Workerを一覧化する。

手順案:

1. Cloudflare Zero TrustでAccess Applicationを作成する。
2. Applicationの対象ホストを確認済みの正規Frontendホスト、パスを `/admin/*` に設定する。実FQDNは要管理画面確認であり、推測入力しない。
3. 選定済みIdentity Providerをログイン方法として設定し、そのIdentity ProviderまたはAccessの設定でMFA強制が有効であることを確認する。
4. Allowポリシーを最小人数の許可対象者に限定する。テスト時に一時的な広い許可ルールを作らない。
5. 有効化前に設定レビューを行い、ホスト、`/admin/*`、Identity Provider、MFA、Allowポリシー、緊急無効化権限を相互確認する。
6. Goの場合のみAccess設定を有効化する。
7. 未許可ユーザーでは、`/admin/login.html` を含む `/admin/*` がAccessで拒否され、管理HTMLへ到達しないことを確認する。
8. 許可された管理者では、Access認証とMFA完了後に管理者ログイン画面へ到達し、アプリ側JWTログインとADMINロール認可が引き続き必要なことを確認する。
9. DevTools Networkで、管理HTML、`/admin/` 外の共通静的アセット、`/api/public/status`、`/api/auth/me`、`/api/admin/*`、`/api/notifications/unread-count`、Socket.ioの成否を確認する。更新・削除・出力操作は行わない。
10. `/`、`/customer/*`、`/worker/*`、公開フォーム、公開status API、WebhookがAccessの認証画面に遷移しないことを確認する。

注意:

- `/api/admin/*` の追加保護ではない。A案中はアプリ側JWT認証とADMINロール認可を継続する。
- Cloudflare AccessだけではRailway直URLのBackend API対策にならない。
- `/admin/*` 以外がAccess対象になる可能性がある場合はNo-Go。
- AccessはFrontend入口の追加保護であり、Railway直URLの`/api/admin/*`にAccess認証を強制するものではない。

## 10. CORS / Socket.io CORS変更手順案

判断:

- 独自ドメインでFrontendを公開する場合、Backendの `CORS_ORIGIN` に独自ドメインOriginを許可する必要がある。
- 既存Production Aliasを切り戻し先として残す場合、複数Origin許可が必要になる。
- Socket.io CORSも `CORS_ORIGIN` を参照しているため、同じOrigin整理が必要になる。
- Backend APIを当面既存公開先のまま使う場合、FrontendのAPI / Socket接続先変更は必須ではない可能性がある。
- Backend APIやSocket接続先も独自ドメイン化する場合、Frontend設定の見直しが必要になる。

手順案:

1. 独自ドメイン公開後に許可するFrontend Originを抽象名で整理する。
2. 既存Production Aliasを切り戻し先として残す期間を決める。
3. `CORS_ORIGIN` に必要なOriginを含める案を作る。
4. Socket.io接続元も同じOriginで許可できるか確認する。
5. Railway Variables変更が必要か判断する。
6. deployや再起動が必要か確認する。
7. Goの場合のみ環境変数変更へ進む。

Browser cache / Service Worker確認:

- `js/config.js` がno-storeで取得されることを確認する。
- `js/api.js` がno-storeで取得されることを確認する。
- `service-worker.js` がno-storeで取得されることを確認する。
- ブラウザDevToolsで古いAPI / Socket接続先が残っていないことを確認する。
- 必要に応じてService Worker更新、キャッシュ削除、ハードリロードを確認手順に含める。

## 11. 動作確認項目

URL / HTTPS:

- wwwなし正規URLが表示できる。
- wwwありから正規URLへ正しくリダイレクトされる。
- リダイレクトループがない。
- HTTPSで表示できる。
- HSTSは初回では有効化していない。
- Cloudflareの対象DNSレコードのProxy状態、SSL/TLSモード、Edge証明書とVercel証明書の状態を設定前後で記録し、証明書エラーやHTTPSリダイレクトループがない。
- wwwありからwwwなしへのRedirect RuleがCloudflare側だけで有効であり、Vercel側のredirect設定と重複していない。

一般導線:

- トップページが表示できる。
- サービス説明が表示できる。
- 問い合わせ導線が表示できる。
- 事前登録導線が表示できる。
- β利用希望導線が表示できる。
- サイト確認モニター導線が表示できる。
- A案の誤認防止文言が維持されている。
- 正式予約、本番決済、カード登録へ進めない。

ログイン / 管理:

- 依頼者ログイン画面が表示できる。
- ワーカーログイン画面が表示できる。
- 管理画面 `/admin/*` がCloudflare Access対象になっている。
- 未許可ユーザーは管理画面へ入れない。
- 許可された管理者はAccess認証後に管理者ログイン画面へ到達できる。
- 許可された管理者は、選定済みIdentity ProviderのMFAを完了しない限りAccessを通過できない。
- 管理HTMLから読み込む `/admin/` 外のJS、CSS、画像、フォント、Service Workerが200で取得でき、Access認証画面や403を返さない。
- DevTools Networkに、意図しない `/`、`/api/*`、`/socket.io/*` へのAccessリダイレクトがない。

API / Socket / Webhook:

- API通信が成功する。
- Socket.io通信が成功する。
- 公開status APIが取得できる。
- Webhookを誤ってAccess対象にしていない。
- `/api/admin/*` は現行のJWT認証とADMINロール認可を維持している。
- 管理画面の代表的な読み取り通信（`/api/public/status`、`/api/auth/me`、`/api/admin/*`、`/api/notifications/unread-count`）とSocket.ioが、Access適用前後で成功する。実際に観測したパス・ステータスのみを記録する。

切り戻し:

- 既存Production Aliasが切り戻し先として使える。
- 既存Production AliasからAPI通信できる。
- 既存Production AliasからSocket.io通信できる。

## 12. 戻し手順

Cloudflare Nameserver変更を戻す場合:

1. ドメイン管理会社側で変更前Nameserverへ戻す。
2. DNS反映状況を確認する。
3. 既存Production Aliasを案内する。
4. メール関連DNSと他サブドメインの到達性を確認する。

DNSレコードを戻す場合:

1. 変更前に退避したDNSレコード一覧を参照する。
2. 変更したレコードだけを戻す。
3. ルートドメイン、www、メール関連、利用中サブドメインを確認する。
4. 反映待ち時間を考慮し、途中で追加変更を重ねない。

Vercel独自ドメインを外す場合:

1. Vercel Domainsで独自ドメイン設定を無効化または削除する。
2. 既存Production Aliasで主要画面が表示できることを確認する。
3. 独自ドメインの案内を停止する。

Redirect Ruleを無効化する場合:

1. Cloudflare Redirect Ruleを無効化する。
2. wwwありとwwwなしの挙動を確認する。
3. ループや意図しない転送が解消したことを確認する。

Cloudflare Accessを無効化する場合:

1. 事前に確認したCloudflare管理権限を持つ担当者が、`/admin/*` のAccess ApplicationまたはAllowポリシーを無効化する。
2. 無効化後、管理者本人がログイン画面まで到達できることだけを読み取り確認する。無効化中も管理画面更新系操作は禁止する。
3. 原因（対象ホスト/パス、Identity Provider、MFA、Allowポリシー、DNS Proxy、SSL/TLS）を切り分け、設定前証跡と照合する。
4. 復旧後に、対象パス、許可対象者、MFA、未許可ユーザー拒否、一般導線、静的アセット、API、Socket.ioを再確認する。

CORS設定を戻す場合:

1. 変更前の `CORS_ORIGIN` 設定へ戻す。
2. API通信を確認する。
3. 既存Production Aliasからの通信を確認する。
4. 独自ドメインからの通信を停止または保留する。

Socket.io CORS設定を戻す場合:

1. 変更前のSocket.io許可Originへ戻す。
2. Socket.io接続を確認する。
3. 既存Production AliasからのSocket.io接続を確認する。

既存Production Aliasへ案内を戻す場合:

1. 利用者向け案内を既存Production Alias基準へ戻す。
2. トップ、問い合わせ、事前登録、β利用希望、サイト確認モニター導線を確認する。
3. A案の誤認防止文言を確認する。

## 13. Go/No-Go条件

Go条件:

- DNSの現状と変更前証跡が確認できている。
- メール関連DNSへの影響が確認できている。
- Vercel設定手順が確認できている。
- CORS / Socket.io CORS変更要否が明確。
- `/admin/*` 以外をAccess対象にしない手順になっている。
- 管理者本人が入れない場合の戻し手順がある。
- 既存Production Aliasを切り戻し先として確認できる。
- 一般導線、公開API、Webhookへの影響が整理されている。
- A案の公開範囲が変わらない。
- 実施担当者、実施日時、確認担当者が決まっている。
- Access Applicationの対象ホストが要管理画面確認の正規Frontendホストに一致し、パスが `/admin/*` のみであることを二者で確認している。
- Identity Provider、MFA強制方法、最小人数のAllowポリシー、未許可ユーザー確認手順、緊急無効化権限が確認済みである。
- Frontendの `/admin/` 外アセットと、Access前後のNetwork確認対象が整理されている。
- Cloudflare Redirect RuleとVercelのDomains / redirect設定の競合がない。
- DNS Proxy状態とSSL/TLS・証明書状態が確認済みである。

No-Go条件:

- 現在のNameserverやDNSレコードが確認できない。
- メール関連レコードへの影響が不明。
- DNSやVercelの戻し手順がない。
- CORS / Socket.io CORSの変更要否が不明。
- `/admin/*` 以外までAccess対象になる可能性がある。
- 管理者自身が入れなくなった場合の復旧方法がない。
- 既存Production Aliasが切り戻し先として確認できない。
- 一般導線、公開API、Webhookへの影響が不明。
- 正式予約や本番決済が開始済みに見える。
- 実操作権限や担当者が不明。
- Accessの対象ホスト、Identity Provider、MFA強制方法、Allowポリシー、緊急無効化担当者のいずれかが未確認。
- `/admin/` 外アセットの取得、Access前後のNetwork確認、CloudflareとVercelのリダイレクト競合確認、DNS ProxyまたはSSL/TLS状態の確認が未実施。

## 14. 実操作時に記録する結果欄

実操作を行う場合は、以下を実値なしで記録する。

| 項目 | 記録欄 |
|------|--------|
| 実施日 |  |
| 実施担当者 | `KAJISHIFT運用担当` |
| 確認担当者 | `KAJISHIFT運用担当` |
| Go / No-Go判定 |  |
| 実施した操作種別 |  |
| 変更前証跡取得 | 済 / 未 |
| DNS影響確認 | 済 / 未 |
| メール関連DNS影響確認 | 済 / 未 |
| Vercel設定確認 | 済 / 未 |
| CORS変更要否判断 | 済 / 未 |
| Socket.io CORS変更要否判断 | 済 / 未 |
| Access対象パス確認 | 済 / 未 |
| Access対象ホスト / `/admin/*` 二者確認 | 済 / 未 |
| Identity Provider / MFA強制方法確認 | 済 / 未 |
| Allowポリシー最小化 / 緊急無効化権限確認 | 済 / 未 |
| 未許可ユーザー拒否確認 | 済 / 未 |
| 共通静的アセット / Network確認 | 済 / 未 |
| Redirect競合 / DNS Proxy / SSL-TLS確認 | 済 / 未 |
| 一般導線確認 | 済 / 未 |
| API / Socket確認 | 済 / 未 |
| Webhook対象外確認 | 済 / 未 |
| 既存Production Alias確認 | 済 / 未 |
| 戻し手順確認 | 済 / 未 |
| 残課題 |  |

## 15. 今回行わないこと

- Cloudflareへのドメイン追加
- Nameserver変更
- DNS変更
- Redirect Rule作成
- Zero Trust / Access設定
- Vercel独自ドメイン追加
- Railway設定変更
- CORS環境変数変更
- Frontend設定変更
- 実装コード変更
- Stripe操作
- DB操作
- Webhook再送
- 管理画面操作
- deploy
- commit
- push

## 16. 2026-07-29 独自ドメイン実画面確認

確認対象の正規URLは `https://kajishift.com` とする。確認では既存のテストアカウントを利用したログインと読み取り通信の確認のみを行い、更新、削除、出力、DB操作、外部サービス操作は行わない。個人情報、認証トークン、ID、Secret、決済情報の実値は記録しない。

| 区分 | 確認URL / 画面 | 確認結果 |
|------|----------------|----------|
| 依頼者 | `/customer/login.html` | 表示、テストアカウントでのログイン、`/customer/dashboard.html` への遷移、REST API、CORS preflight 200、Socket.io接続、WebSocket 101を確認。重大なConsoleエラーと旧Vercel URLへの意図しない遷移は確認されなかった。 |
| ワーカー | `/worker/login.html` | 表示、テストアカウントでのログイン、`/worker/dashboard.html` への遷移、REST API、CORS preflight 200、Socket.io接続、WebSocket 101を確認。重大なConsoleエラーと旧Vercel URLへの意図しない遷移は確認されなかった。 |
| 管理者 | `/admin/login.html` | 表示、管理者アカウントでのログイン、`/admin/dashboard.html` への遷移、管理API通信、CORS preflight 200、Socket.io接続、WebSocket 101を確認。重大なConsoleエラーと旧Vercel URLへの意図しない遷移は確認されなかった。 |

この結果は、独自ドメインからRailway REST APIおよびSocket.ioへの現行接続が動作することを示す。Cloudflare Accessによる管理画面入口保護、管理APIの追加保護、Railway直URL対策の完了を示すものではない。

### 未完了の保護と表示上の注意

- 2026-07-29時点のCloudflare DNSは、`kajishift.com` および `www.kajishift.com` のVercel向けCNAMEがともにDNS onlyであり、Cloudflare HTTPプロキシ、WAF、CDN、Accessは現行通信に適用されていない。
- Cloudflare Accessを有効にする前に、Access対象ホストをProxiedへ変更する必要がある。変更時はVercel表示、SSL証明書、wwwからwwwなしへの308リダイレクト、Railway REST API、Socket.ioへの影響を確認してからGo/No-Goを判断する。
- Cloudflare Accessによる `/admin/*` のMFA付き保護は未設定であり、`/admin/login.html` は外部から直接表示可能である。
- `/api/admin/*` の追加保護およびRailway直URL経由の管理API対策は未完了である。現行のJWT認証、ADMINロール認可、運用ガードは継続する。
- 現行の管理者ログイン画面には「この管理画面へのアクセスはIP制限・多要素認証で保護されています」と表示される。この文言はCloudflare AccessおよびIP制限の実設定前の現状と一致しないため、保護を有効化するまで実装上の表示リスクとして扱う。
- 該当表示はFrontendリポジトリ `kajishift-frontend` の `admin/login.html` にあり、ログインフォームの後、既存管理者による管理者登録案内の直前に配置されている。BackendリポジトリにはFrontendファイル実体が含まれないため、正確な行番号はFrontendリポジトリで確認する。
