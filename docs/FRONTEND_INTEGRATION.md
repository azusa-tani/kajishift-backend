# フロントエンド・バックエンド連携ガイド

## 📋 目次

1. [基本情報](#基本情報)
2. [認証方法](#認証方法)
3. [APIエンドポイント一覧](#apiエンドポイント一覧)
4. [リクエスト・レスポンス形式](#リクエストレスポンス形式)
5. [エラーハンドリング](#エラーハンドリング)
6. [WebSocket（Socket.io）連携](#websocketsocketio連携)
7. [ファイルアップロード](#ファイルアップロード)
8. [レート制限](#レート制限)
9. [CORS設定](#cors設定)
10. [実装例](#実装例)

---

## 基本情報

### ベースURL

- **開発環境**: `http://localhost:3000/api`
- **本番環境**: `https://kajishift-backend-production.up.railway.app/api`
- **フロントエンド本番URL**: `https://kajishift-frontend.vercel.app`

### APIドキュメント

- **Swagger UI**: `http://localhost:3000/api-docs`
- すべてのエンドポイントの詳細な仕様を確認できます

### ヘルスチェック

```http
GET /api/health
```

**レスポンス例:**
```json
{
  "status": "OK",
  "message": "KAJISHIFT API is running",
  "timestamp": "2026-02-13T19:54:13.000Z"
}
```

---

## 認証方法

### JWT（JSON Web Token）認証

すべての認証が必要なエンドポイントでは、JWTトークンを使用します。

### 1. ユーザー登録

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "山田 太郎",
  "phone": "090-1234-5678",
  "role": "CUSTOMER"  // CUSTOMER, WORKER, ADMIN
}
```

**レスポンス:**
```json
{
  "message": "ユーザー登録が完了しました",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. ログイン

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "message": "ログイン成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田 太郎",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. トークンの使用方法

認証が必要なリクエストでは、`Authorization`ヘッダーにトークンを設定します：

```javascript
// JavaScript/TypeScript の例
const token = localStorage.getItem('token'); // またはセッションストレージ

fetch('http://localhost:3000/api/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### 4. パスワードリセット

#### パスワードリセットメール送信

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### パスワードリセット実行

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

---

## APIエンドポイント一覧

### 認証API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/auth/login` | ログイン | 不要 |
| GET | `/api/auth/me` | 現在のユーザー情報取得 | 必須 |
| POST | `/api/auth/forgot-password` | パスワードリセットメール送信 | 不要 |
| POST | `/api/auth/reset-password` | パスワードリセット | 不要（トークン必要） |

### ユーザー管理API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/users/me` | 自分の情報取得 | 必須 |
| PUT | `/api/users/me` | 自分の情報更新 | 必須 |
| GET | `/api/users/:id` | ユーザー詳細取得 | 必須 |

### 予約管理API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/bookings` | 予約一覧取得・検索 | 必須 |
| POST | `/api/bookings` | 予約作成 | 必須（顧客のみ） |
| GET | `/api/bookings/:id` | 予約詳細取得 | 必須 |
| PUT | `/api/bookings/:id` | 予約更新 | 必須 |
| DELETE | `/api/bookings/:id` | 予約キャンセル | 必須 |

**検索パラメータ（GET /api/bookings）:**
- `status`: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- `serviceType`: サービス種別（例: 掃除・清掃、料理、洗濯、買い物代行）
- `startDate`: 開始日（ISO形式、YYYY-MM-DD）
- `endDate`: 終了日（ISO形式、YYYY-MM-DD）
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）

### ワーカー管理API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/workers` | ワーカー一覧取得・検索 | 不要 |
| GET | `/api/workers/:id` | ワーカー詳細取得 | 不要 |
| PUT | `/api/workers/me` | ワーカープロフィール更新 | 必須 |

**検索パラメータ（GET /api/workers）:**
- `keyword`: キーワード検索（名前、自己紹介）
- `area`: エリア検索（住所）
- `minHourlyRate`: 最低時給（円）
- `maxHourlyRate`: 最高時給（円）
- `minRating`: 最低評価（0-5）
- `approvalStatus`: PENDING, APPROVED, REJECTED（デフォルト: APPROVED）
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）

### レビューAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/reviews` | レビュー投稿 | 必須（依頼者のみ） |
| GET | `/api/reviews/:workerId` | ワーカーのレビュー一覧取得 | 不要 |

### チャットAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/messages/:bookingId` | メッセージ一覧取得 | 必須 |
| POST | `/api/messages` | メッセージ送信 | 必須 |

### 決済API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/payments` | 決済履歴取得 | 必須 |
| POST | `/api/payments` | 決済処理 | 必須（顧客のみ） |

### サポートAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/support` | 問い合わせ一覧取得 | 必須 |
| POST | `/api/support` | 問い合わせ作成 | 必須 |
| GET | `/api/support/:id` | 問い合わせ詳細取得 | 必須 |

### 通知API

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/notifications` | 通知一覧取得 | 必須 |
| GET | `/api/notifications/unread-count` | 未読通知数取得 | 必須 |
| PUT | `/api/notifications/read-all` | すべての通知を既読にする | 必須 |
| PUT | `/api/notifications/:id/read` | 通知を既読にする | 必須 |
| DELETE | `/api/notifications/:id` | 通知を削除 | 必須 |

### お気に入りAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| GET | `/api/favorites` | お気に入り一覧取得 | 必須 |
| POST | `/api/favorites` | お気に入り追加 | 必須 |
| DELETE | `/api/favorites/:id` | お気に入り削除 | 必須 |
| DELETE | `/api/favorites/worker/:workerId` | ワーカーIDでお気に入り削除 | 必須 |
| GET | `/api/favorites/check/:workerId` | お気に入りかどうかを確認 | 必須 |

### ファイルアップロードAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|--------------|------|------|
| POST | `/api/upload` | ファイルアップロード | 必須 |
| GET | `/api/upload` | ファイル一覧取得 | 必須 |
| GET | `/api/upload/:id` | ファイル情報取得 | 必須 |
| GET | `/api/upload/:id/download` | ファイルダウンロード | 必須 |
| DELETE | `/api/upload/:id` | ファイル削除 | 必須 |

### 管理者API

管理者のみアクセス可能なエンドポイントです。詳細はSwagger UIを参照してください。

**主なエンドポイント:**
- `GET /api/admin/users` - ユーザー管理
- `GET /api/admin/workers` - ワーカー管理
- `PUT /api/admin/workers/:id/approve` - ワーカー承認
- `GET /api/admin/reports/*` - 各種レポート取得
- `GET /api/admin/reports/*/export/csv` - CSVエクスポート
- `GET /api/admin/reports/*/export/excel` - Excelエクスポート
- `POST /api/admin/notifications/system` - システム通知作成・送信
- `GET /api/admin/reports/chart/:reportType` - グラフ用データ取得
- `GET /api/admin/reports/comparison/:reportType` - 比較レポート取得
- `POST /api/admin/reports/custom` - カスタムレポート取得

---

## リクエスト・レスポンス形式

### リクエストヘッダー

```javascript
{
  'Authorization': 'Bearer {token}',  // 認証が必要な場合
  'Content-Type': 'application/json'  // JSONリクエストの場合
}
```

### ページネーション

多くの一覧取得APIはページネーションに対応しています。

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）

**レスポンス形式:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 日付形式

- **ISO 8601形式**: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **日付のみ**: `YYYY-MM-DD`
- **時刻のみ**: `HH:mm`

---

## エラーハンドリング

### エラーレスポンス形式

```json
{
  "error": "Error Type",
  "message": "エラーメッセージ"
}
```

### HTTPステータスコード

| ステータスコード | 説明 |
|----------------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | バリデーションエラー |
| 401 | 認証エラー（トークンなし、無効、期限切れ） |
| 403 | 権限エラー（ロール不足） |
| 404 | リソースが見つかりません |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

### 認証エラーの例

```json
{
  "error": "Authentication Error",
  "message": "認証トークンが必要です"
}
```

```json
{
  "error": "Authentication Error",
  "message": "トークンの有効期限が切れています"
}
```

### バリデーションエラーの例

```json
{
  "error": "Validation Error",
  "message": "入力値に問題があります",
  "details": [
    {
      "field": "email",
      "message": "メールアドレスの形式が正しくありません"
    }
  ]
}
```

### フロントエンドでのエラーハンドリング例

```javascript
async function fetchUserData() {
  try {
    const response = await fetch('http://localhost:3000/api/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 401) {
        // トークンが無効または期限切れ
        // ログアウト処理またはトークンリフレッシュ
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      throw new Error(error.message || 'エラーが発生しました');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('エラー:', error);
    // エラー表示処理
  }
}
```

---

## WebSocket（Socket.io）連携

### 接続方法

リアルタイム通知とメッセージ機能には、Socket.ioを使用します。

#### JavaScript/TypeScript の例

```javascript
import { io } from 'socket.io-client';

// Socket.io接続
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'  // JWTトークンを設定
  },
  transports: ['websocket', 'polling']
});

// 接続成功時のイベント
socket.on('connected', (data) => {
  console.log('接続成功:', data);
  // { message: '接続が確立されました', userId: 'uuid' }
});

// 通知受信イベント
socket.on('notification', (data) => {
  console.log('新しい通知:', data);
  // { type: 'notification', data: { id, type, title, content, ... } }
  // 通知をUIに表示
});

// メッセージ受信イベント
socket.on('message', (data) => {
  console.log('新しいメッセージ:', data);
  // { type: 'message', data: { id, content, senderId, ... } }
  // メッセージをUIに表示
});

// 未読通知数更新イベント
socket.on('unread-count', (data) => {
  console.log('未読通知数:', data);
  // { type: 'unread-count', count: 5 }
  // 未読数をUIに更新
});

// エラーハンドリング
socket.on('connect_error', (error) => {
  console.error('接続エラー:', error);
  // 認証エラーの場合、トークンを再取得
});

// 切断時の処理
socket.on('disconnect', (reason) => {
  console.log('切断:', reason);
  // 再接続処理など
});

// 切断
socket.disconnect();
```

#### React の例

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function NotificationComponent() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connected', (data) => {
      console.log('接続成功:', data);
    });

    socket.on('notification', (data) => {
      setNotifications(prev => [data.data, ...prev]);
    });

    socket.on('unread-count', (data) => {
      setUnreadCount(data.count);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div>
      <h2>通知 ({unreadCount})</h2>
      {notifications.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
}
```

### イベント一覧

| イベント名 | 説明 | データ形式 |
|-----------|------|-----------|
| `connected` | 接続成功 | `{ message: string, userId: string }` |
| `notification` | 新しい通知 | `{ type: 'notification', data: Notification }` |
| `message` | 新しいメッセージ | `{ type: 'message', data: Message }` |
| `unread-count` | 未読通知数更新 | `{ type: 'unread-count', count: number }` |
| `connect_error` | 接続エラー | `Error` |
| `disconnect` | 切断 | `reason: string` |

---

## ファイルアップロード

### アップロード方法

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('category', 'PROFILE');  // オプション: PROFILE, DOCUMENT, OTHER

const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Content-Typeは設定しない（FormDataが自動設定）
  },
  body: formData
});

const data = await response.json();
// { id, filename, originalName, mimeType, size, url, ... }
```

### ファイルダウンロード

```javascript
const response = await fetch(`http://localhost:3000/api/upload/${fileId}/download`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'filename.ext';
a.click();
```

### ファイル表示

アップロードされたファイルは以下のURLでアクセスできます：

```
http://localhost:3000/uploads/{filename}
```

---

## レート制限

APIにはレート制限が設定されています。

### 制限内容

- **一般的なAPI**: 100リクエスト/15分
- **認証API**: 5リクエスト/15分
- **パスワードリセット**: 3リクエスト/15分

### レート制限超過時のレスポンス

```json
{
  "error": "Too Many Requests",
  "message": "リクエストが多すぎます。しばらく待ってから再度お試しください。"
}
```

**HTTPステータスコード**: `429`

### フロントエンドでの対応

```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`${retryAfter}秒後に再試行してください`);
  // リトライ処理
}
```

---

## CORS設定

バックエンドのCORS設定は以下の通りです：

- **開発環境**: `http://localhost:5500`（デフォルト）
- **本番環境**: 環境変数 `CORS_ORIGIN` で設定

フロントエンドのオリジンが異なる場合は、バックエンドの `.env` ファイルで `CORS_ORIGIN` を設定してください。

---

## 実装例

### APIクライアントクラス（TypeScript）

```typescript
class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'エラーが発生しました');
    }

    return response.json();
  }

  // 認証
  async register(data: RegisterData) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  // ユーザー
  async getMe() {
    return this.request<User>('/users/me');
  }

  // 予約
  async getBookings(params?: BookingSearchParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<PaginatedResponse<Booking>>(
      `/bookings${query ? `?${query}` : ''}`
    );
  }

  async createBooking(data: CreateBookingData) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ワーカー
  async getWorkers(params?: WorkerSearchParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<PaginatedResponse<Worker>>(
      `/workers${query ? `?${query}` : ''}`
    );
  }

  // お気に入り
  async getFavorites() {
    return this.request<PaginatedResponse<Favorite>>('/favorites');
  }

  async addFavorite(workerId: string) {
    return this.request<Favorite>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    });
  }

  async removeFavorite(workerId: string) {
    return this.request('/favorites/worker/' + workerId, {
      method: 'DELETE',
    });
  }

  // 通知
  async getNotifications() {
    return this.request<PaginatedResponse<Notification>>('/notifications');
  }

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread-count');
  }
}

// 使用例
const api = new ApiClient();
await api.login('user@example.com', 'password123');
const user = await api.getMe();
const bookings = await api.getBookings({ page: 1, limit: 20 });
```

### React Hooks の例

```jsx
// useAuth.ts
import { useState, useEffect } from 'react';
import { api } from './apiClient';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.data.user);
    return response;
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return { user, loading, login, logout };
}

// useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connected', () => {
      console.log('Socket接続成功');
    });

    newSocket.on('notification', (data) => {
      setNotifications(prev => [data.data, ...prev]);
    });

    newSocket.on('unread-count', (data) => {
      setUnreadCount(data.count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return { socket, notifications, unreadCount };
}
```

---

## その他の注意事項

### 環境変数

フロントエンドで使用する環境変数の例：

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### トークンの保存

- **推奨**: `localStorage` または `sessionStorage`
- **セキュアな方法**: `httpOnly` クッキー（バックエンドで設定）

### トークンの有効期限

JWTトークンには有効期限があります。期限切れの場合は、再度ログインするか、リフレッシュトークン機能を実装してください。

### タイムゾーン

日付・時刻はUTCで保存されます。フロントエンドで表示する際は、ユーザーのタイムゾーンに変換してください。

---

## サポート

問題が発生した場合は、以下を確認してください：

1. **Swagger UI**: `http://localhost:3000/api-docs` でAPI仕様を確認
2. **バックエンドログ**: サーバーのコンソール出力を確認
3. **ネットワークタブ**: ブラウザの開発者ツールでリクエスト/レスポンスを確認

---

**最終更新**: 2026年3月（フロントエンドのVercel移行完了）
