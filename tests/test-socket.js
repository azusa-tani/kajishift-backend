/**
 * Socket.ioリアルタイム通知機能のテストスクリプト
 * 
 * 使用方法:
 * 1. サーバーが起動していることを確認
 * 2. このスクリプトを実行: node tests/test-socket.js
 * 3. 別のターミナルで通知やメッセージを送信して、リアルタイムで受信されることを確認
 */

const io = require('socket.io-client');
const http = require('http');

// テスト用の設定
const SERVER_URL = 'http://localhost:3000';
// test-api.jsと同じユーザー情報を使用
const TEST_USER_EMAIL = 'test@example.com'; // テスト用のユーザー
const TEST_USER_PASSWORD = 'password123';

console.log('🔌 Socket.ioリアルタイム通知機能のテストを開始します...\n');

// サーバーが起動しているか確認
function checkServerStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`サーバーは起動していますが、ヘルスチェックが失敗しました: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        reject(new Error('サーバーが起動していません。別のターミナルで "npm run dev" を実行してください。'));
      } else {
        reject(error);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('サーバーへの接続がタイムアウトしました。サーバーが起動しているか確認してください。'));
    });

    req.end();
  });
}

// まず、ログインしてトークンを取得
function getAuthToken() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode === 200 && data.data && data.data.token) {
            resolve(data.data.token);
          } else {
            const errorMsg = data.message || data.error || body || '不明なエラー';
            reject(new Error(`ログイン失敗: ${res.statusCode} - ${errorMsg}`));
          }
        } catch (error) {
          reject(new Error(`レスポンス解析エラー: ${error.message}\n   レスポンス: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      let errorMessage = `リクエストエラー: ${error.message}`;
      if (error.code === 'ECONNREFUSED') {
        errorMessage += '\n   サーバーが起動していない可能性があります。';
        errorMessage += '\n   別のターミナルで "npm run dev" を実行してください。';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage += '\n   ホスト名が解決できません。';
      } else if (error.code) {
        errorMessage += `\n   エラーコード: ${error.code}`;
      }
      reject(new Error(errorMessage));
    });
    
    // タイムアウト設定（5秒）
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('リクエストタイムアウト: サーバーが応答しませんでした。サーバーが起動しているか確認してください。'));
    });

    req.write(postData);
    req.end();
  });
}

// Socket.io接続のテスト
async function testSocketConnection() {
  // まずサーバーが起動しているか確認
  try {
    console.log('🔍 サーバーの起動状態を確認中...');
    await checkServerStatus();
    console.log('✅ サーバーは正常に起動しています\n');
  } catch (error) {
    console.error('❌ サーバー確認エラー:', error.message);
    console.log('\n💡 解決方法:');
    console.log('   1. 別のターミナルで "npm run dev" を実行してください');
    console.log('   2. サーバーが起動するまで待ってから、再度このテストを実行してください\n');
    process.exit(1);
  }

  // 認証トークンを取得
  let token;
  try {
    console.log('📡 認証トークンを取得中...');
    token = await getAuthToken();
    console.log('✅ 認証トークンを取得しました\n');
  } catch (error) {
    console.error('❌ ログインエラー:', error.message);
    console.log('\n💡 ヒント:');
    console.log('   1. テスト用のユーザーが存在するか確認してください');
    console.log('   2. tests/test-socket.jsのTEST_USER_EMAILとTEST_USER_PASSWORDを既存のユーザーに変更してください');
    console.log('   3. または、先に "npm run test:api" を実行してテストユーザーを作成してください\n');
    process.exit(1);
  }

  console.log('🔌 Socket.ioに接続中...');
  const socket = io(SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  // 接続成功
  socket.on('connect', () => {
    console.log('✅ Socket.io接続が確立されました');
    console.log(`   Socket ID: ${socket.id}\n`);
  });

  // 接続確認イベント
  socket.on('connected', (data) => {
    console.log('✅ サーバーからの接続確認を受信しました');
    console.log(`   メッセージ: ${data.message}`);
    console.log(`   ユーザーID: ${data.userId}\n`);
  });

  // 新しい通知を受信
  socket.on('notification', (data) => {
    console.log('🔔 新しい通知を受信しました！');
    console.log('   通知データ:', JSON.stringify(data.data, null, 2));
    console.log('');
  });

  // 新しいメッセージを受信
  socket.on('message', (data) => {
    console.log('💬 新しいメッセージを受信しました！');
    console.log('   メッセージデータ:', JSON.stringify(data.data, null, 2));
    console.log('');
  });

  // 未読通知数を更新
  socket.on('unread-count', (data) => {
    console.log('📊 未読通知数が更新されました');
    console.log(`   未読数: ${data.count}\n`);
  });

  // 接続エラー
  socket.on('connect_error', (error) => {
    console.error('❌ 接続エラー:', error.message);
    if (error.message.includes('認証')) {
      console.log('\n💡 ヒント: トークンが無効または期限切れの可能性があります。');
      console.log('   再度ログインして新しいトークンを取得してください。\n');
    }
    process.exit(1);
  });

  // 切断
  socket.on('disconnect', (reason) => {
    console.log(`\n⚠️  Socket.io接続が切断されました: ${reason}`);
    if (reason === 'io server disconnect') {
      console.log('   サーバー側で切断されました。');
    }
  });

  // エラー
  socket.on('error', (error) => {
    console.error('❌ Socket.ioエラー:', error);
  });

  // テスト完了メッセージ
  console.log('⏳ リアルタイム通知を待機中...');
  console.log('   別のターミナルで以下の操作を実行してください:\n');
  console.log('   1. システム通知を送信:');
  console.log('      POST http://localhost:3000/api/admin/notifications/system');
  console.log('      (Swagger UIから実行可能)\n');
  console.log('   2. メッセージを送信:');
  console.log('      POST http://localhost:3000/api/messages');
  console.log('      (Swagger UIから実行可能)\n');
  console.log('   3. 通知を既読にする:');
  console.log('      PUT http://localhost:3000/api/notifications/:id/read');
  console.log('      (未読通知数が更新されることを確認)\n');
  console.log('   Ctrl+C で終了します\n');

  // 10秒後に接続状態を確認
  setTimeout(() => {
    if (socket.connected) {
      console.log('✅ 接続は正常に維持されています\n');
    } else {
      console.log('⚠️  接続が切断されています\n');
    }
  }, 10000);

  // プロセス終了時の処理
  process.on('SIGINT', () => {
    console.log('\n\n👋 テストを終了します...');
    socket.disconnect();
    process.exit(0);
  });
}

// テスト実行
testSocketConnection().catch(error => {
  console.error('❌ テスト実行エラー:', error);
  process.exit(1);
});
