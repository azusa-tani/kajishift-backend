# 残りのタスク一覧

最終更新日: 2026年2月18日（実装完了）

## 📋 フロントエンド未実装機能

### 1. 管理者機能のフロントエンド連携

#### 1.1 ユーザー管理（`admin/users.html`）
- [x] `suspendUser()` - ユーザー停止機能の実装 ✅ 実装完了
- [x] `activateUser()` - ユーザー有効化機能の実装 ✅ 実装完了
- [ ] `deleteUser()` - ユーザー削除機能の実装（UIにボタンがある場合）
- **必要なAPI**: `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id`（バックエンド実装済み）
- **必要なapi.jsメソッド**: `updateUser()`, `deleteUser()` ✅ 実装完了

#### 1.2 ワーカー管理（`admin/workers.html`）
- [x] `suspendWorker()` - ワーカー停止機能の実装 ✅ 実装完了
- [ ] `deleteWorker()` - ワーカー削除機能の実装（UIにボタンがある場合）
- **必要なAPI**: `PUT /api/admin/workers/:id`, `DELETE /api/admin/workers/:id`（バックエンド実装済み）
- **必要なapi.jsメソッド**: `updateWorker()`, `deleteWorker()` ✅ 実装完了

#### 1.3 問い合わせ管理（`admin/support.html`）
- [x] 問い合わせアサイン機能の実装 ✅ 実装完了
- [x] 問い合わせステータス更新機能の実装 ✅ 実装完了
- [x] 問い合わせ削除機能の実装 ✅ 実装完了
- **必要なAPI**: `PUT /api/admin/support/:id`, `DELETE /api/admin/support/:id`（バックエンド実装済み）
- **必要なapi.jsメソッド**: `updateSupportTicket()`, `deleteSupportTicket()` ✅ 実装完了

### 2. 設定管理（`admin/settings.html`）
- [x] サービスメニュー管理機能 - 実装済み
- [x] 対応エリア管理機能 - 実装済み
- [x] システム設定管理機能 - 実装済み

### 3. CSVエクスポート機能
- [x] 予約レポートCSVエクスポート - 実装済み
- [x] ユーザーレポートCSVエクスポート - 実装済み
- [x] ワーカーレポートCSVエクスポート - 実装済み
- [x] 売上レポートCSVエクスポート - 実装済み

## 📋 バックエンド未実装機能

### すべてのAPIは実装済み ✅

バックエンドの主要なAPIはすべて実装済みです。以下のAPIが利用可能です：

- ✅ 管理者API（ユーザー・ワーカー・サポートチケットの更新・削除）
- ✅ システム設定API（サービスメニュー、対応エリア、システム設定）
- ✅ 領収書生成API
- ✅ カード管理API
- ✅ その他すべてのAPI

## 🔧 実装が必要なapi.jsメソッド

✅ **すべて実装完了**

以下のメソッドを`api.js`に追加しました：

```javascript
// 管理者API
async updateUser(userId, data) {
  return this.request(`/admin/users/${userId}`, {
    method: 'PUT',
    body: data,
  });
}

async deleteUser(userId) {
  return this.request(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

async updateWorker(workerId, data) {
  return this.request(`/admin/workers/${workerId}`, {
    method: 'PUT',
    body: data,
  });
}

async deleteWorker(workerId) {
  return this.request(`/admin/workers/${workerId}`, {
    method: 'DELETE',
  });
}

async updateSupportTicket(ticketId, data) {
  return this.request(`/admin/support/${ticketId}`, {
    method: 'PUT',
    body: data,
  });
}

async deleteSupportTicket(ticketId) {
  return this.request(`/admin/support/${ticketId}`, {
    method: 'DELETE',
  });
}
```

## 📝 実装優先順位

### 優先度: 高 ✅ 実装完了
1. **ユーザー管理機能の連携**（`admin/users.html`） ✅ 実装完了
   - ✅ ユーザー停止・有効化機能
   - [ ] ユーザー削除機能（UIにボタンがないため未実装）

2. **ワーカー管理機能の連携**（`admin/workers.html`） ✅ 実装完了
   - ✅ ワーカー停止機能
   - [ ] ワーカー削除機能（UIにボタンがないため未実装）

3. **問い合わせ管理機能の連携**（`admin/support.html`） ✅ 実装完了
   - ✅ 問い合わせアサイン機能
   - ✅ 問い合わせステータス更新機能
   - ✅ 問い合わせ削除機能

### 優先度: 中
- その他の細かいUI改善
- エラーハンドリングの強化
- ローディング状態の改善

## ✅ 実装済み機能

以下の機能は既に実装済みです：

- ✅ CSVエクスポート機能（すべてのレポート）
- ✅ システム設定管理（サービスメニュー、対応エリア）
- ✅ 領収書ダウンロード機能
- ✅ カード管理機能
- ✅ 通知一覧ページ
- ✅ レビュー機能UI
- ✅ お気に入り機能UI
- ✅ WebSocket（リアルタイム通信）
- ✅ ファイルアップロードUI連携
- ✅ **ユーザー管理機能（停止・有効化）** - 2026年2月18日実装完了
- ✅ **ワーカー管理機能（停止）** - 2026年2月18日実装完了
- ✅ **問い合わせ管理機能（アサイン・ステータス更新・削除）** - 2026年2月18日実装完了

---

**注意**: バックエンドAPIはすべて実装済みのため、フロントエンドの連携のみを実装すれば完了します。
