# KAJISHIFT API設計書

## ベースURL
```
http://localhost:3000/api
```

## 認証方式
JWT (JSON Web Token)
- リクエストヘッダーに `Authorization: Bearer <token>` を付与

## エンドポイント一覧

### 認証系

#### ユーザー登録
```
POST /api/auth/register
```

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "山田 太郎",
  "phone": "090-1234-5678",
  "role": "customer" // "customer" | "worker"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ユーザー登録が完了しました",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "customer"
    },
    "token": "jwt-token"
  }
}
```

#### ログイン
```
POST /api/auth/login
```

**リクエストボディ:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "ログインに成功しました",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "customer"
    },
    "token": "jwt-token"
  }
}
```

#### ログアウト
```
POST /api/auth/logout
```

**認証:** 必須

**レスポンス:**
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

### ユーザー系

#### 自分の情報取得
```
GET /api/users/me
```

**認証:** 必須

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田 太郎",
    "phone": "090-1234-5678",
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### 自分の情報更新
```
PUT /api/users/me
```

**認証:** 必須

**リクエストボディ:**
```json
{
  "name": "山田 花子",
  "phone": "090-9876-5432"
}
```

### ワーカー系

#### ワーカー一覧取得
```
GET /api/workers
```

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `status`: ステータスフィルター（"approved", "pending"）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "workers": [
      {
        "id": "uuid",
        "name": "佐藤 花子",
        "bio": "経験豊富な家事代行ワーカーです",
        "rating": 4.8,
        "hourlyRate": 2500,
        "status": "approved"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### ワーカー詳細取得
```
GET /api/workers/:id
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "佐藤 花子",
    "bio": "経験豊富な家事代行ワーカーです",
    "rating": 4.8,
    "hourlyRate": 2500,
    "status": "approved",
    "reviews": []
  }
}
```

#### ワーカー利用不可スロット（カレンダー週ビュー）

認証済みワーカー本人のみ。`Authorization: Bearer <token>`、ロール `WORKER` 必須。

```
GET    /api/workers/me/unavailable-slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
POST   /api/workers/me/unavailable-slots
PUT    /api/workers/me/unavailable-slots/sync
DELETE /api/workers/me/unavailable-slots?date=YYYY-MM-DD&slotIndex=0-47
DELETE /api/workers/me/unavailable-slots/:id
```

リクエスト／レスポンスの JSON 例・エラーコード・タイムゾーン契約・DB スキーマは [`WORKER_UNAVAILABLE_SLOTS_API.md`](./WORKER_UNAVAILABLE_SLOTS_API.md) に集約。

### 予約系

#### 予約一覧取得
```
GET /api/bookings
```

**認証:** 必須

**クエリパラメータ:**
- `status`: ステータスフィルター（単一またはカンマ区切り）。文字列は正規化され大文字の enum と照合
- `available`: ワーカー向け。`true` 相当で未割り当て（`workerId` IS NULL）の予約のみ。真偽は `true` / `1` / `yes` 等も許容（実装: `bookingService.js`）
- `serviceType`, `startDate`, `endDate`: オプション。`YYYY-MM-DD` は UTC 日境界で日付範囲比較
- `page`: ページ番号
- `limit`: 1ページあたりの件数

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "serviceType": "cleaning",
        "scheduledDate": "2024-02-01T10:00:00Z",
        "duration": 3,
        "status": "confirmed",
        "totalAmount": 7500,
        "worker": {
          "id": "uuid",
          "name": "佐藤 花子"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

#### 予約作成
```
POST /api/bookings
```

**認証:** 必須（依頼者のみ）

**リクエストボディ:**
```json
{
  "workerId": "uuid",
  "serviceType": "cleaning",
  "scheduledDate": "2024-02-01T10:00:00Z",
  "duration": 3,
  "address": "東京都渋谷区...",
  "notes": "キッチンの掃除をお願いします"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "予約が作成されました",
  "data": {
    "booking": {
      "id": "uuid",
      "serviceType": "cleaning",
      "scheduledDate": "2024-02-01T10:00:00Z",
      "duration": 3,
      "status": "pending",
      "totalAmount": 7500
    }
  }
}
```

#### 予約詳細取得
```
GET /api/bookings/:id
```

**認証:** 必須

#### 予約更新
```
PUT /api/bookings/:id
```

**認証:** 必須

#### 予約キャンセル
```
DELETE /api/bookings/:id
```

**認証:** 必須

### 決済系

#### 決済処理
```
POST /api/payments
```

**認証:** 必須

**リクエストボディ:**
```json
{
  "bookingId": "uuid",
  "paymentMethod": "credit_card",
  "cardToken": "token"
}
```

#### 決済履歴取得
```
GET /api/payments
```

**認証:** 必須

### 管理者系

#### 管理者を新規登録（既存管理者のみが実行可能）
```
POST /api/admin/register
```

**認証:** 必須（管理者のみ）

**リクエストボディ:**
```json
{
  "email": "newadmin@kajishift.com",
  "password": "password123",
  "name": "新規管理者",
  "phone": "090-1234-5678"
}
```

**レスポンス:**
```json
{
  "message": "管理者の登録が完了しました",
  "data": {
    "id": "uuid",
    "email": "newadmin@kajishift.com",
    "name": "新規管理者",
    "phone": "090-1234-5678",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-02-24T..."
  }
}
```

**注意:** 既存の管理者のみが新しい管理者を登録できます。一般ユーザーはこのエンドポイントにアクセスできません。

## エラーレスポンス

```json
{
  "error": "Error message",
  "message": "詳細なエラーメッセージ",
  "details": {}
}
```

### ステータスコード
- `200`: 成功
- `201`: 作成成功
- `400`: バリデーションエラー
- `401`: 認証エラー
- `403`: 権限エラー
- `404`: リソースが見つからない
- `500`: サーバーエラー
