# ワーカー利用不可スロット API

ワーカー用週ビューカレンダー（`worker/calendar.html`）で `localStorage` の `kajishift_worker_calendar_unavailable_slots` に相当するデータを、**認証済みワーカー本人のみ**がサーバーで管理するための API です。

## ベース URL・認証

- **ベース URL**: 既存 API と同じ（例: `http://localhost:3000/api`）
- **認証**: `Authorization: Bearer <JWT>`
- **権限**: ロール `WORKER` のみ。トークン内の `user.id` が `workerId` として固定され、**他ワーカー ID を指定するフィールドは存在しません**。

## タイムゾーン契約

| 項目 | 契約 |
|------|------|
| 暦日 `date` / `localDate` | **Asia/Tokyo（JST）の暦日**を表す `YYYY-MM-DD` 文字列。フロントの `formatLocalYMD` が日本利用前提であれば本 API と一致します。 |
| `slotIndex` | その JST 日の 30 分刻み。`0` = 00:00〜00:29、…、`47` = 23:30〜23:59。 |
| 内部表現 | スロット境界は **UTC+9 固定**で壁時計から絶対時刻に変換し、予約との重なりを判定します（日本は夏時間なし）。 |
| `createdAt` / `updatedAt` | ISO 8601（DB は UTC 保存、従来どおり）。 |

**同日の重複**: `(workerId, localDate, slotIndex)` で一意。同一キーの二重登録は単一作成では既存行を返し、一括ではスキップ扱いにできます。

**境界**: 各スロットは半開区間 `[開始, 次スロット開始)` として隣接スロットと重なりません。

## 予約（`bookings`）との関係

- 利用不可は **別テーブル** `worker_unavailable_slots` に格納します。
- **理由**: 予約は顧客・ワーカー・ステータス・金額・住所などビジネスエンティティであり、ワーカーの「私用ブロック」はライフサイクル・権限・検証が異なります。外部キーで `bookings` にぶら下げると、未割当予約やキャンセル時の整合が不必要に複雑になります。
- **重なりルール（本実装）**: 対象ワーカーの **`CONFIRMED` および `IN_PROGRESS`** の予約と時間が重なる利用不可の**新規作成・週同期は禁止**（HTTP `409`、`code: BOOKING_OVERLAP`）。削除は常に許可します（予約は変えない）。

**予約の占有区間（サーバー契約）**: 開始は `scheduledDate` の絶対時刻、終了は開始から `duration` 時間後（半開区間でスロットと判定）。`startTime` は表示・互換用とし、オーバーラップ判定の主軸は `scheduledDate` + `duration` です（フロントは可能な限り `scheduledDate` を実開始の RFC3339 に寄せることを推奨）。

## エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| `GET` | `/workers/me/unavailable-slots` | `startDate`〜`endDate` の一覧 |
| `POST` | `/workers/me/unavailable-slots` | 単一追加、または `items` 一括追加 |
| `PUT` | `/workers/me/unavailable-slots/sync` | 指定期間の利用不可を**全削除のうえ指定集合で置換** |
| `DELETE` | `/workers/me/unavailable-slots` | クエリ `date` + `slotIndex` で削除 |
| `DELETE` | `/workers/me/unavailable-slots/:id` | UUID 指定で削除 |

---

## GET 一覧

**リクエスト**

`GET /api/workers/me/unavailable-slots?startDate=2026-04-14&endDate=2026-04-20`

**クエリ（必須）**

- `startDate`, `endDate`: `YYYY-MM-DD`（JST 暦、文字列比較で範囲フィルタ）

**レスポンス例（200）**

```json
{
  "data": {
    "slots": [
      {
        "id": "b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8",
        "date": "2026-04-15",
        "slotIndex": 20,
        "slotKey": "2026-04-15|20",
        "createdAt": "2026-04-17T08:00:00.000Z",
        "updatedAt": "2026-04-17T08:00:00.000Z"
      }
    ]
  }
}
```

---

## POST 単一作成

**リクエスト**

```json
{
  "date": "2026-04-15",
  "slotIndex": 20
}
```

**レスポンス例**

- 新規: `201`
```json
{
  "data": {
    "slot": {
      "id": "…",
      "date": "2026-04-15",
      "slotIndex": 20,
      "slotKey": "2026-04-15|20",
      "createdAt": "…",
      "updatedAt": "…"
    },
    "created": true
  }
}
```

- 既に同一スロットあり: `200`（`created: false`）
- 予約と重複: `409`（下記エラーコード表）

---

## POST 一括（localStorage 移行など）

**リクエスト**

```json
{
  "items": [
    { "date": "2026-04-15", "slotIndex": 20 },
    "2026-04-16|10"
  ],
  "continueOnError": true
}
```

- `items`: オブジェクト配列または `"YYYY-MM-DD|slotIndex"` 文字列の混在可。
- `continueOnError`: `true` のとき、不正・重複予約・既存スロットは `skipped` に積み、処理続行。`false`（省略時）のときは最初のエラーで全体失敗。

**レスポンス例（200）**

```json
{
  "data": {
    "created": [
      {
        "id": "…",
        "date": "2026-04-15",
        "slotIndex": 20,
        "slotKey": "2026-04-15|20",
        "createdAt": "…",
        "updatedAt": "…"
      }
    ],
    "skipped": [
      { "date": "2026-04-16", "slotIndex": 10, "reason": "BOOKING_OVERLAP" },
      { "id": "…", "date": "2026-04-14", "slotIndex": 0, "slotKey": "2026-04-14|0", "createdAt": "…", "updatedAt": "…", "reason": "ALREADY_EXISTS" }
    ]
  }
}
```

---

## PUT 週（期間）同期

`startDate`〜`endDate`（**両端含む**）の既存レコードをすべて削除し、`slots` の内容で作り直します。範囲外の日付の利用不可は変更しません。

**リクエスト**

```json
{
  "startDate": "2026-04-14",
  "endDate": "2026-04-20",
  "slots": [
    { "date": "2026-04-15", "slotIndex": 18 },
    "2026-04-16|40"
  ]
}
```

**レスポンス例（200）**

```json
{
  "data": {
    "slots": [
      {
        "id": "…",
        "date": "2026-04-15",
        "slotIndex": 18,
        "slotKey": "2026-04-15|18",
        "createdAt": "…",
        "updatedAt": "…"
      }
    ]
  }
}
```

いずれかのスロットが予約と重なる場合、**トランザクション全体がロールバック**され `409` を返します。

---

## DELETE（日付 + スロット）

`DELETE /api/workers/me/unavailable-slots?date=2026-04-15&slotIndex=20`

**レスポンス例（200）**

```json
{
  "data": {
    "deleted": true,
    "slot": {
      "id": "…",
      "date": "2026-04-15",
      "slotIndex": 20,
      "slotKey": "2026-04-15|20",
      "createdAt": "…",
      "updatedAt": "…"
    }
  }
}
```

---

## DELETE（ID）

`DELETE /api/workers/me/unavailable-slots/b2c3d4e5-f6a7-4890-b1c2-d3e4f5a6b7c8`

---

## エラーコード表

| HTTP | `code`（任意） | 意味 |
|------|------------------|------|
| 400 | `MISSING_QUERY` | 一覧で `startDate` / `endDate` 不足 |
| 400 | `INVALID_DATE` | 日付形式が `YYYY-MM-DD` でない |
| 400 | `INVALID_RANGE` | `startDate` > `endDate` |
| 400 | `INVALID_SLOT_INDEX` | `slotIndex` が 0〜47 の整数でない |
| 400 | `INVALID_BODY` / `INVALID_ITEM` | JSON 形式不正 |
| 400 | `DATE_OUT_OF_SYNC_RANGE` | `sync` の `slots` に範囲外の日付 |
| 400 | `INVALID_ID` | UUID 形式でない ID |
| 401 | — | 認証エラー（既存ミドルウェア） |
| 403 | — | ワーカー以外（`authorize('WORKER')`） |
| 404 | `NOT_FOUND` | 削除対象が存在しない、または他人のデータ |
| 409 | `BOOKING_OVERLAP` | 確定・進行中予約と重複（`details.bookingId` に該当予約） |

---

## DB スキーマ案（実装済み）

**テーブル**: `worker_unavailable_slots`

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID TEXT PK | 公開 ID |
| `worker_id` | TEXT FK → `users.id` | ワーカー（CASCADE DELETE） |
| `local_date` | VARCHAR(10) | JST 暦 `YYYY-MM-DD` |
| `slot_index` | INTEGER | 0〜47 |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**インデックス**

- UNIQUE `(worker_id, local_date, slot_index)`
- INDEX `(worker_id, local_date)`（期間一覧用）

---

## フロント実装メモ

1. 週表示初期化: `GET /api/bookings?...` と同じ週の `startDate` / `endDate` で本 API を呼び、`slotKey` または `date`+`slotIndex` でグリッドを塗る。
2. マスクリックでオン: `POST` 単一。オフ: `DELETE` + クエリ、または `id` が分かれば `DELETE /:id`。
3. **移行（任意）**: `localStorage` の配列を `POST` の `items` に渡し `continueOnError: true`。成功後に `localStorage.removeItem('kajishift_worker_calendar_unavailable_slots')` など。

---

## Prisma マイグレーション

`prisma/migrations/20260417120000_worker_unavailable_slots/migration.sql` を追加済みです。デプロイ先で `npx prisma migrate deploy` を実行してください。
