# Cloudflare・独自ドメイン・管理保護 方針資料

最終更新: 2026-07-09  
確認者: `KAJISHIFT運用担当`

このドキュメントは、A案「本番決済なし限定公開」後にCloudflare、独自ドメイン公開、管理画面、管理API保護を検討するための実操作前資料である。

このドキュメントでは、Cloudflare操作、DNS変更、Vercel設定変更、Railway設定変更、Stripe操作、DB操作、Webhook再送、管理画面での更新系操作、実装コード変更、commit、push、deployを行わない。

このドキュメントには、個人情報、メールアドレス、電話番号、住所、問い合わせ本文、フォーム回答本文、審査回答本文、問い合わせID、userId風の値、workerId、bookingId、予約ID、submissionId、実URL、APIキー、Secret、DB接続文字列、決済情報の実値を記録しない。

## 1. A案の前提

KAJISHIFTは、2026年7月7日にA案「本番決済なし限定公開」として公開済み。

A案で公開している範囲:

- 問い合わせ受付
- 事前登録受付
- β利用希望受付
- サービス内容の閲覧
- サイト確認モニターからのフィードバック受付

A案で開始していない範囲:

- 家事代行の実働
- 正式予約
- 本番決済
- 本番カード登録
- 本番課金につながる導線
- worker受注・辞退・作業完了
- 管理画面の更新・削除・承認/却下などの更新系操作

Cloudflareや独自ドメインの検討は、A案の公開範囲を広げるものではない。独自ドメイン公開後も、正式予約、本番決済、本番カード登録、本番課金導線、worker受注系、管理更新系操作は開始しない。

## 2. 現行構成の確認結果

確認した範囲では、BackendはExpress APIとして構成され、FrontendはVercel側のProduction Aliasを基準に公開確認されている。

Backend側の現行構成:

- `src/index.js` で `/api/public`、`/api/auth`、`/api/admin` などのAPIルートを登録している。
- `src/index.js` のCORSは `CORS_ORIGIN` をカンマ区切りで読み、許可Origin方式で判定している。
- `src/config/socket.js` のSocket.io CORSも `CORS_ORIGIN` を参照している。
- `src/middleware/security.js` でHelmetとAPI全体のrate limit、認証系rate limitを設定している。
- `src/index.js` で `trust proxy` を1 hopに設定している。
- `src/index.js` の `/api/health/db` はproductionでは404を返す。
- `src/routes/public.js` の `/api/public/status` と `/api/public/status/health` は公開状態確認用APIとして存在する。
- `src/routes/admin.js` は `/api/admin/*` 配下に接続され、共通でJWT認証とADMINロール認可を要求している。
- `src/routes/admin.js` は一部の運用復旧系APIを除き、POST / PUT / PATCH / DELETEに `adminWrite` の運用ガードを適用している。

現時点で確認できる範囲では、Cloudflare Accessの認証結果をBackendで検証する実装、Cloudflare経由リクエストのみを許可する実装、Railway直URLからの管理API直叩きをBackend側で拒否する専用実装は見当たらない。

## 3. 独自ドメイン公開方針

独自ドメイン公開は、A案の利用者向け導線を分かりやすくし、Stripe本番審査や今後の正式公開に向けた証跡を整理するための準備として扱う。

URL設計案は、実URLをdocsに記録せず、以下の抽象名で管理する。

| 区分 | 方針案 | 備考 |
|------|--------|------|
| 一般ユーザー向けURL案 | サービス紹介、問い合わせ、事前登録、β利用希望、サイト確認モニター導線の入口 | A案の主要公開URLとして扱う |
| アプリ本体URL案 | 依頼者・ワーカーのログイン後画面を含むFrontend | 一般ユーザー向けURLと同一ドメイン配下にするか、サブドメイン分離するかを事前判断する |
| 管理画面URL案 | `/admin/*` または管理専用サブドメイン | Cloudflare Access保護対象にする |
| Backend API URL案 | Frontendから呼び出すAPI入口 | 独自ドメイン化するか、当面既存Backend公開URLを継続するかを別途判断する |

既存Vercel Production Aliasとの関係:

- 現在の公開確認は既存Vercel Production Aliasを基準に行う。
- 独自ドメイン公開後も、初期切り替え直後は既存Production Aliasを切り戻し先として扱う。
- 独自ドメインを主要導線にする場合でも、Vercel個別Deployment URLや実URLはdocsに記録しない。
- Vercel個別Deployment URLは検証・切り戻し確認用として内部管理にとどめ、外部向け案内やdocsには残さない。

wwwあり / なしの扱い:

- 正規URLをwwwあり、またはwwwなしのどちらかに決める。
- 非正規URLから正規URLへのリダイレクトをCloudflareまたはVercelのどちらで担うか決める。
- 初回公開ではリダイレクトループ回避を優先し、設定責任範囲を1か所に寄せる。

SSL/TLS方針:

- 利用者向け画面、管理画面、APIはHTTPS前提にする。
- CloudflareとVercelのSSL/TLS設定が競合しないよう、事前にモードと証明書発行の責任範囲を確認する。
- HSTSは切り戻し難度が上がるため、初回独自ドメイン公開時は慎重に判断する。

## 4. Cloudflare導入目的

Cloudflareを導入する主目的:

- DNS管理を一元化する。
- 独自ドメイン公開のDNSレコードを管理する。
- 管理画面 `/admin/*` をCloudflare Accessで追加保護する。
- 将来的なWAF、Bot対策、Rate Limiting、キャッシュ制御、セキュリティヘッダー強化の土台にする。
- Stripe本番審査に向けて、独自ドメイン、HTTPS、管理画面保護、運用証跡を整理する。

A案中の扱い:

- Cloudflare導入は方針整理と手順整理にとどめる。
- DNS切り替え、Nameserver変更、Access適用、WAF有効化、Rate Limiting有効化、キャッシュルール変更は実施しない。
- 設定する場合は、実施日時、担当者、影響範囲、戻し手順、確認手順、No-Go条件を先に決める。

## 5. 管理画面 `/admin/*` 保護方針

管理画面は、A案中も読み取り確認に限定し、更新・削除・承認/却下・CSV/Excel出力などは行わない。

Cloudflare Accessを使う場合の想定:

- 保護対象はFrontendの `/admin/*` とする。
- 管理者ログイン画面を含めるか、ログイン後画面のみを含めるかを事前に決める。
- 原則として、管理者ログイン画面も未許可ユーザーから隠す方針を優先する。
- 許可対象者は `KAJISHIFT運用担当` など、管理作業に必要な最小人数に限定する。
- 許可対象者のメール実値はdocsに記録しない。
- 認証方式は、メール認証、Googleログイン、MFAを候補とし、正式公開前はMFA必須を基本方針にする。
- 未許可ユーザーはCloudflare Accessの認証前画面または拒否画面で止め、管理画面HTMLへ到達させない。

一般ユーザー画面への影響:

- `/admin/*` のみをAccess対象にし、トップ、問い合わせ、事前登録、β利用希望、依頼者画面、ワーカー画面、公開status APIにはAccessをかけない。
- Cloudflare Accessの対象パス設定を誤ると、一般ユーザーやサイト確認モニターが公開ページに入れなくなるため、対象パスを最小化する。
- 管理画面保護の導入後も、問い合わせ・事前登録・β利用希望・サイト確認モニター導線が影響を受けないことを確認する。

補足:

- Cloudflare Accessは管理画面HTMLへの入口保護であり、管理APIのアプリ側認証を置き換えるものではない。
- 管理画面に入れた後も、Frontendから呼ばれる `/api/admin/*` はJWT認証とADMINロール認可を必須にする。

## 6. 管理API `/api/admin/*` 保護方針

現行確認:

- `/api/admin/*` は `src/index.js` で `src/routes/admin.js` に接続されている。
- `src/routes/admin.js` では全ルートに `authenticate` を適用し、JWT Bearer tokenを必須にしている。
- 同ファイルでは全ルートに `authorize('ADMIN')` を適用し、ADMINロールのみを許可している。
- POST / PUT / PATCH / DELETEの多くは `requireOperationForMethods('adminWrite')` の対象であり、maintenanceなどの運用モードでは管理更新を止められる。

方針:

- Cloudflare Accessだけで十分とは扱わない。
- `/api/admin/*` は、アプリ側のJWT認証、ADMINロール認可、更新系運用ガードを継続必須にする。
- Cloudflare Accessは入口保護、アプリ側認証はAPI保護として二層で扱う。
- 管理APIの追加保護は、Railway直URLやBackend直URLからの直叩きも考慮する。
- 一般公開API、依頼者API、ワーカーAPI、公開status APIを誤って塞がないよう、対象は `/api/admin/*` に限定する。

追加保護の候補:

- BackendでCloudflare Accessの認証済みヘッダーまたは署名付きJWTを検証する。
- `/api/admin/*` のみ、Cloudflare経由で付与されるヘッダーを要求する。
- Backend公開URLをCloudflare TunnelやPrivate Network経由に寄せ、直URL公開を縮小する。
- Railway側で可能な範囲のIP制限、Private Networking、サービス公開設定を検討する。
- 管理APIに管理者MFA状態、管理者アカウントロック、監査ログを追加する。
- 管理APIの更新系、削除系、承認/却下系、CSV/Excel出力系は追加の二重確認や監査対象にする。

今回の扱い:

- 実装変更は行わない。
- 管理API保護の実装要否は、Cloudflare AccessだけでBackend直URLを防げるか、Railway直URLが残るか、管理APIの運用開始時期を確認してから判断する。

## 7. Railway直URLの扱い

想定リスク:

- Cloudflare経由の独自ドメインを公開しても、BackendのRailway直URLが公開されたままだと、Cloudflare AccessやCloudflare WAFを経由せずにAPIへ到達される可能性がある。
- `/api/admin/*` はJWT認証とADMINロール認可があるため即時無防備ではないが、Cloudflare Accessによる入口保護は直URLアクセスには効かない。
- 管理者トークンが漏れた場合、Railway直URLから管理APIを叩けるリスクが残る。

切り分け方針:

| API区分 | 方針 |
|---------|------|
| `/api/public/*` | 公開状態確認など、一般公開前提。ただし返す情報は最小限にする |
| `/api/health` | 外形監視向けに公開継続候補。返す情報は最小限にする |
| `/api/auth/*` | ログイン、登録、パスワードリセットなど。rate limitと運用ガードを維持する |
| customer向けAPI | 認証必須APIはJWT認証を維持する。A案中の予約・決済導線は運用ガードとFrontend抑止を確認する |
| worker向けAPI | 認証必須APIはJWT認証を維持する。worker受注・辞退・作業完了はA案中に開始しない |
| `/api/admin/*` | JWT認証、ADMINロール、運用ガードに加え、Cloudflare経由性またはAccess認証済み性の追加確認を検討する |
| `/api/webhooks/*` | Stripeなど外部サービスの署名検証を優先し、Cloudflare Access対象にしない |

将来的な対策候補:

- Backend APIの独自ドメイン化とCORS許可Originの整理。
- `/api/admin/*` のみCloudflare Access認証済みヘッダーをBackendで必須化。
- Railway直URLは一般公開APIとWebhookに必要な範囲を確認し、管理APIだけ追加制限する。
- Cloudflare Tunnelなど、直URL公開を縮小できる構成を検討する。
- API GatewayまたはReverse Proxyを置き、管理APIの入口をCloudflare経由に限定する。
- 管理者トークンの有効期限短縮、失効、再認証、MFA状態確認を追加する。

## 8. 影響範囲

| 対象 | 想定影響 | 確認観点 |
|------|----------|----------|
| 一般ユーザー画面 | 独自ドメイン化、リダイレクト、SSL/TLS、キャッシュの影響 | トップ、サービス内容、問い合わせ、事前登録、β利用希望が表示できる |
| 依頼者画面 | CORS、API URL、ログイン、通知、公開status APIの影響 | A案の誤認防止文言が維持され、正式予約・本番決済に進めない |
| ワーカー画面 | CORS、API URL、ログイン、worker導線の影響 | 受注・辞退・作業完了が開始済みに見えない |
| 管理画面 | Cloudflare Access対象 | 許可対象者のみ到達でき、未許可ユーザーは拒否される |
| API | CORS、Cloudflare経由性、Railway直URL、rate limitの影響 | `/api/admin/*` だけ追加保護し、公開APIやWebhookを塞がない |
| 既存Production Alias | 切り戻し先 | 独自ドメイン公開後も確認・戻し先として扱う |
| サイト確認モニター導線 | 独自ドメイン化、リダイレクト、SSL/TLSの影響 | フォーム導線やサイト閲覧導線が切れない |

## 9. 実操作前Go/No-Goチェックリスト

DNS変更前:

- [ ] 正規URLを決めた。
- [ ] wwwあり / なしのリダイレクト方針を決めた。
- [ ] DNSレコードの種類、向き先、TTL、反映時間を整理した。
- [ ] Cloudflare Nameserver変更の影響範囲を整理した。
- [ ] 既存メール、外部サービス、検証用サブドメインへの影響を確認した。
- [ ] 戻し手順と戻し先を決めた。

Vercelドメイン設定前:

- [ ] Vercel側に追加するドメイン種別を決めた。
- [ ] Production Aliasとの関係を決めた。
- [ ] 個別Deployment URLをdocsに残さない運用を確認した。
- [ ] 独自ドメイン公開後の主要画面確認リストを用意した。
- [ ] A案の誤認防止文言が独自ドメインでも確認できる計画を用意した。

Cloudflare Access設定前:

- [ ] Access対象パスを `/admin/*` に限定する方針を確認した。
- [ ] 管理者ログイン画面をAccess対象に含めるか決めた。
- [ ] 許可対象者を最小人数にした。
- [ ] メール認証、Googleログイン、MFAの要件を決めた。
- [ ] 未許可ユーザーの拒否確認手順を用意した。
- [ ] 一般ユーザー、依頼者、ワーカー、サイト確認モニター導線に影響しないことを確認する手順を用意した。

Backend / Railway側変更前:

- [ ] CORS許可Originに独自ドメインを追加する必要があるか確認した。
- [ ] Socket.io CORSにも同じ考慮が必要か確認した。
- [ ] `/api/admin/*` だけ追加保護する設計になっている。
- [ ] `/api/public/*`、`/api/health`、`/api/webhooks/*` を誤って塞がない設計になっている。
- [ ] Railway直URLを残す場合のリスクを許容するか、追加対策を行うか判断した。
- [ ] 変更を行う場合のdeploy要否、検証環境、切り戻し手順を整理した。

Stripe審査向け証跡化前:

- [ ] 独自ドメイン、HTTPS、法務ページ、問い合わせ導線、A案の未決済方針を抽象情報で記録する。
- [ ] 管理画面保護方針、MFA方針、管理API保護方針を記録する。
- [ ] 実URL、個人情報、ID、Secret、決済情報の実値をdocsや提出用メモに残さない。
- [ ] 本番決済、本番カード登録、本番課金を開始していないことを明記する。

Go候補:

- A案の公開範囲が変わらない。
- 変更範囲、担当、日時、戻し手順、確認観点が明確。
- 管理画面Access保護が一般画面へ影響しない。
- Backend CORS、API URL、Webhook、公開status APIへの影響が整理済み。
- No-Go時に既存Production Alias基準へ戻せる。

No-Go候補:

- 実URLやSecretをdocsへ記録しそうな状態。
- 戻し手順が未整理。
- CORS、SSL/TLS、リダイレクト、Access対象パスが未確定。
- `/admin/*` 以外までCloudflare Access対象になり、一般導線を塞ぐ可能性がある。
- `/api/admin/*` と一般APIの切り分けが未整理。
- Railway直URLの管理APIリスクを許容するか決まっていない。
- 本番決済や正式予約が開始済みに見える導線が残っている。

## 10. 戻し手順

DNS設定を戻す場合:

- 変更前のDNSレコードとTTLを実値なしで内部記録しておく。
- 問題発生時は、変更したレコードを変更前状態へ戻す。
- 反映中は既存Production Aliasを案内可能な戻し先として扱う。
- 反映確認では、トップ、問い合わせ、事前登録、β利用希望、公開status APIの到達性を確認する。

Vercel側ドメイン設定を戻す場合:

- 独自ドメインをProductionの主要導線から外す。
- 既存Production Aliasで主要画面が表示できることを確認する。
- 個別Deployment URLを外部案内やdocsに記録しない。
- 戻し後、A案の誤認防止文言と問い合わせ導線を読み取り確認する。

Cloudflare Access設定を無効化する場合:

- `/admin/*` のAccessポリシーを一時無効化または対象外に戻す。
- 無効化中も管理画面更新系操作は禁止する。
- Access無効化が長引く場合は、管理画面の利用を読み取り確認のみに限定し、管理者以外へURLを共有しない。
- 再有効化前に許可対象者、MFA、拒否確認を再確認する。

管理API保護方針を一旦保留する場合:

- `/api/admin/*` の現行JWT認証、ADMINロール認可、運用ガードを継続する。
- 管理APIの更新系、削除系、承認/却下系、CSV/Excel出力系はA案中に使わない。
- Railway直URLの追加制限は未実施リスクとして明記し、B案移行前の必須判断項目に残す。
- Cloudflare Accessを入れてもBackend直URL対策にはならない点を運用担当が理解する。

## 11. 実施順序案

1. 方針確定
2. 現行構成確認
3. Go/No-Go判断
4. Cloudflare / DNS設定
5. Vercel独自ドメイン設定
6. 管理画面Access保護
7. 管理API保護方針の実装要否判断
8. 証跡整理

今回の段階では、1から3の準備資料化までを対象とし、4以降の実操作は行わない。

## 12. 正規URL案の比較

実URLはdocsに記録せず、正規URLは抽象名で比較する。

| 案 | メリット | デメリット | A案でのおすすめ |
|----|----------|------------|------------------|
| wwwあり | 従来型のWebサイトURLとして利用者に伝えやすい。CloudflareやVercelでサブドメインとして扱いやすい | ルートドメインとwwwのリダイレクト設計が必要。短いURLを希望する場合はやや冗長 | どちらでも可。ただし迷う場合は、運用担当が案内しやすいかで判断する |
| wwwなし | 短く、サービス名の公式URLとして見せやすい。SNSプロフィールや法務ページで簡潔に案内できる | DNS、Vercel、Cloudflareの設定責任範囲を誤るとリダイレクトやSSL/TLSの確認が複雑になる | A案では有力候補。正規URLを1つに固定し、wwwありからリダイレクトする方針を事前確認する |
| アプリ用サブドメイン分離 | LP / 法務 / 問い合わせ導線と、ログイン後アプリを分けやすい。将来のキャッシュ、Cookie、CORS、Access設計を分離しやすい | 初期設定、CORS、Cookie、リダイレクト、利用者案内が増える。A案では管理対象が増えやすい | A案では急いで分離しない。B案前または正式運用前に再検討する |
| 管理画面を同一ドメイン配下 `/admin/*` に置く | 現行Frontend構成と相性がよく、Cloudflare Accessのパス指定で保護しやすい。初期導入の変更範囲が小さい | 管理画面URLの存在は推測されやすい。Access対象パス設定を誤ると一般画面へ影響する | A案では推奨。`/admin/*` 全体をAccess対象にする前提で、一般導線に影響しないことを確認する |
| 管理画面を管理専用サブドメインに分ける | 管理画面を利用者導線から分離できる。Access、WAF、CORS、Cookie、監査の設計を独立させやすい | Vercel設定、DNS、Access、CORS、Frontend参照の整理が増える。初回公開時の切り戻しも複雑になる | A案では保留。B案前に、管理画面強化とあわせて採用要否を判断する |

A案での暫定おすすめ:

- 一般ユーザー向け正規URLは、wwwあり / なしのどちらか1つに固定し、非正規URLから正規URLへリダイレクトする方針にする。
- 初回独自ドメイン公開では、アプリ用サブドメイン分離や管理専用サブドメイン分離を急がず、現行構成に近い形で影響範囲を小さくする。
- 管理画面は当面、同一ドメイン配下の `/admin/*` としてCloudflare Access保護を検討する。
- 管理専用サブドメインは、B案移行前または正式運用前の管理保護強化タスクとして再判断する。

## 13. Cloudflare Access対象範囲案

| 案 | メリット | デメリット | A案 / Stripe審査準備での評価 |
|----|----------|------------|-------------------------------|
| 管理者ログイン画面を含めて `/admin/*` 全体をAccess対象にする | 未許可ユーザーが管理者ログイン画面へ到達しない。管理画面の存在やログインUIの露出を抑えられる。Stripe審査準備の管理画面保護証跡として説明しやすい | 許可対象者のAccess認証が失敗すると、管理者ログイン前に止まる。Access設定ミス時に管理者自身も入れない可能性がある | 推奨。A案では管理画面更新系操作をしないため、入口を強く保護する方針と相性がよい |
| 管理者ログイン後画面のみAccess対象にする | 管理者ログイン画面までは到達できるため、Access設定ミス時の切り分けがやや容易 | ログイン画面が外部から見える。ログイン試行、フィッシング誘導、ブルートフォース観点の露出が残る。保護範囲の説明が複雑になる | 非推奨。初期検証目的なら一時的に候補になり得るが、本番向け方針としては弱い |

推奨方針:

- A案およびStripe審査準備では、管理者ログイン画面を含めて `/admin/*` 全体をCloudflare Access対象にする案を推奨する。
- Access対象は `/admin/*` に限定し、一般ユーザー画面、依頼者画面、ワーカー画面、問い合わせ、事前登録、β利用希望、サイト確認モニター導線には適用しない。
- Accessの許可対象者は最小人数にし、MFA必須を基本方針にする。
- Accessを有効化する前に、管理者本人が入れなくなった場合の戻し手順を決める。

## 14. 管理API `/api/admin/*` 追加保護の段階案

| 段階 | 実装要否 | メリット | リスク | 実施タイミング |
|------|----------|----------|--------|----------------|
| A案中は現行のJWT認証・ADMINロール・運用ガードを継続するのみ | 今回は実装不要 | 既存構成を変えず、A案の公開範囲を広げない。CORSやRailway設定変更を伴わない | Railway直URLからの管理API到達可能性は残る。管理者トークン漏えい時の追加防御は限定的 | A案中の暫定方針。管理画面更新系操作を行わない前提で許容する |
| B案移行前にCloudflare Access認証済みヘッダーまたはCloudflare経由性確認を追加する | 実装変更が必要になる可能性が高い | Cloudflare Accessとアプリ側認証の二層保護にできる。Railway直URLからの管理API直叩き対策を検討できる | ヘッダー検証の実装ミス、CORS、Webhook、公開APIの誤遮断に注意が必要。Cloudflare経由性だけでは偽装対策の設計が必要 | B案移行前の必須判断。管理更新系操作や本番決済に近づく前に実施要否を決める |
| 将来的にCloudflare Tunnel、API Gateway、Reverse Proxyなどを検討する | 構成変更が必要 | Backend直URL公開を縮小し、管理API入口を統制しやすい。WAF、監査、rate limitを一元化しやすい | インフラ構成が複雑化し、障害時の切り分けや切り戻しが難しくなる。運用担当者の理解と手順整備が必要 | 正式運用前、または利用者・決済・管理更新系が増える段階で検討する |

段階方針:

- A案中は、現行のJWT認証、ADMINロール、運用ガードを維持し、管理画面更新系操作を行わないことでリスクを抑える。
- B案移行前には、Cloudflare Access認証済み性をBackendで確認するか、Cloudflare経由性を検証するか、または別の入口制御を入れるかを必ず判断する。
- 将来的なTunnel / Gateway / Reverse Proxyは、独自ドメイン公開と同時に急いで入れず、監査・運用・切り戻し手順とセットで検討する。

## 15. Railway直URL対策の判断案

| 判断案 | メリット | デメリット | A案での扱い |
|--------|----------|------------|-------------|
| Railway直URLをすぐ塞ぐ | Cloudflareを経由しないアクセスを早期に減らせる。管理APIの直叩きリスクを下げられる | 公開API、Webhook、監視、Frontend API接続への影響が大きい。設定変更や実装変更、deployが必要になる可能性がある | 今回は行わない。A案の実操作前整理段階では過剰になりやすい |
| A案中は残リスクとして管理する | 現行公開を壊さず、問い合わせ・事前登録・β利用希望・サイト確認モニター導線を維持できる。実装変更やインフラ変更を避けられる | 管理者トークン漏えい時、Railway直URLから `/api/admin/*` を叩かれるリスクが残る | 暫定推奨。管理更新系操作をしない、管理者トークンを厳格管理する、B案前に再判断する条件付きで許容する |

A案中に許容できる理由:

- A案では正式予約、本番決済、本番カード登録、本番課金導線、worker受注・辞退・作業完了、管理更新系操作を開始していない。
- `/api/admin/*` は現行でもJWT認証とADMINロール認可を要求している。
- POST / PUT / PATCH / DELETEの多くは運用ガードの対象であり、運用モードで管理更新を止められる。
- Railway直URLを急に塞ぐと、公開API、Webhook、監視、Frontend接続、CORSに予期しない影響を与える可能性がある。

B案移行前に再判断すべき理由:

- B案では本番決済、本番カード登録、正式予約、管理更新系操作に近づくため、管理APIの追加保護が重要になる。
- 管理者トークンが漏えいした場合、JWTとADMINロールだけでは、トークン有効期間中の直叩きを止めにくい。
- Stripe本番審査や正式運用では、管理画面だけでなく管理APIの保護方針も説明できる状態が望ましい。
- CSV / Excel出力、承認/却下、削除、設定更新などは個人情報や運用状態への影響が大きい。

`/api/admin/*` のみ追加保護する考え方:

- 追加保護の対象は `/api/admin/*` に限定する。
- `/api/public/*`、`/api/health`、`/api/auth/*`、customer向けAPI、worker向けAPI、`/api/webhooks/*` を巻き込まない。
- Webhookは外部サービスから直接到達する必要があり、Cloudflare Access対象にしない。
- 公開status APIやヘルスチェックは、監視とFrontend表示に必要な最小情報だけを返す。
- 管理APIにCloudflare Access認証済みヘッダーを要求する場合は、ヘッダー偽装対策とRailway直URLからの到達時の扱いを設計する。

## 16. 次回Go/No-Go判断で決める項目

次回のGo/No-Goでは、以下を未決事項として扱い、1つずつ決める。

- [ ] 正規URLをどの抽象案にするか。
- [ ] wwwあり / wwwなしのどちらを正規にするか。
- [ ] 非正規URLから正規URLへのリダイレクト責任範囲をCloudflare側、Vercel側、または片方に限定するか。
- [ ] Cloudflare Access対象パスを `/admin/*` に限定するか。
- [ ] 管理者ログイン画面をCloudflare Access対象に含めるか。
- [ ] 管理API追加保護をA案中に行うか、B案移行前に回すか。
- [ ] Railway直URLリスクをA案中に残リスクとして許容するか。
- [ ] Backend APIの `CORS_ORIGIN` 変更が必要か。
- [ ] Socket.io CORS変更が必要か。
- [ ] 既存Production Aliasを切り戻し先として維持するか。
- [ ] 独自ドメイン公開後もA案の公開範囲が変わらないことを確認するか。
- [ ] Stripe本番審査向け証跡に実URLや個人情報を残さない運用を確認するか。

次回判断の暫定おすすめ:

- 正規URLは1つに固定し、wwwあり / なしは運用担当が案内しやすい方を選ぶ。
- 管理画面は同一ドメイン配下 `/admin/*` をCloudflare Access対象にする。
- 管理者ログイン画面もAccess対象に含める。
- 管理API追加保護はA案中に急がず、B案移行前の必須判断にする。
- Railway直URLリスクはA案中は残リスクとして管理し、B案前に `/api/admin/*` 限定の追加保護を再判断する。
- CORSとSocket.io CORSは、独自ドメイン公開前に変更要否を確認する。
- 既存Production Aliasは切り戻し先として維持する。

## 17. 今回行わないこと

- Cloudflare操作
- DNS変更
- Vercel設定変更
- Railway設定変更
- Stripe操作
- DB操作
- Webhook再送
- 管理画面での更新系操作
- 実装コード変更
- commit
- push
- deploy

## 18. 次に進む場合の推奨作業

次に進む場合は、実操作前に以下を行う。

- 独自ドメインの正規URL、wwwあり / なし、リダイレクト責任範囲を決める。
- Cloudflare DNSレコード案を実値を含まない形でレビューする。
- Vercel Domains追加手順と切り戻し手順を担当者間で確認する。
- Cloudflare Accessの対象パスを `/admin/*` に限定する設計をレビューする。
- `/api/admin/*` の追加保護を、Cloudflare AccessだけでなくRailway直URL対策込みで設計する。
- CORS許可Originの変更要否をFrontend / Backend双方で確認する。
- A案の公開範囲が独自ドメイン公開後も変わらないことをGo/No-Goで再確認する。
