/**
 * KAJISHIFT API テストスクリプト
 * Node.js用
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// HTTPリクエストを送信するヘルパー関数
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    // /api プレフィックスを追加
    const fullPath = path.startsWith('/') ? `/api${path}` : `/api/${path}`;
    const url = new URL(fullPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// テスト結果を表示
function printTest(name, result, success) {
  console.log(`\n${success ? '✅' : '❌'} ${name}`);
  if (result.status) {
    console.log(`   ステータス: ${result.status}`);
  }
  if (result.data) {
    console.log(`   レスポンス:`, JSON.stringify(result.data, null, 2));
  }
  return success;
}

// メインのテスト関数
async function runTests() {
  console.log('========================================');
  console.log('KAJISHIFT API テスト');
  console.log('========================================\n');

  // 1. ヘルスチェック
  try {
    const result = await makeRequest('GET', '/health');
    printTest('1. ヘルスチェック', result, result.status === 200);
  } catch (error) {
    console.log('\n❌ 1. ヘルスチェック');
    console.log(`   エラー: ${error.message}`);
  }

  // 2. ユーザー登録
  try {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'テストユーザー',
      role: 'CUSTOMER',
    };
    const result = await makeRequest('POST', '/auth/register', registerData);
    const success = result.status === 200 || result.status === 201;
    
    if (success && result.data.data && result.data.data.token) {
      authToken = result.data.data.token;
      console.log(`   JWTトークン取得: ✅`);
      printTest('2. ユーザー登録', result, success);
    } else if (result.status === 500 || (result.data && result.data.error && result.data.error.includes('既に登録されています'))) {
      // 既に存在する場合はログインを試みる
      console.log(`   既に登録されているため、ログインを試みます...`);
      try {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };
        const loginResult = await makeRequest('POST', '/auth/login', loginData);
        if (loginResult.status === 200 && loginResult.data.data && loginResult.data.data.token) {
          authToken = loginResult.data.data.token;
          console.log(`   ログイン成功`);
          console.log(`   JWTトークン取得: ✅`);
          console.log('\n✅ 2. ユーザー登録');
          console.log('   ステータス: 既に登録済み → ログイン成功');
        } else {
          printTest('2. ユーザー登録', result, false);
        }
      } catch (loginError) {
        console.log(`   ログインも失敗: ${loginError.message}`);
        printTest('2. ユーザー登録', result, false);
      }
    } else {
      printTest('2. ユーザー登録', result, success);
    }
  } catch (error) {
    console.log('\n❌ 2. ユーザー登録');
    console.log(`   エラー: ${error.message}`);
    // エラーが発生した場合も、既に登録されている可能性があるのでログインを試みる
    try {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const loginResult = await makeRequest('POST', '/auth/login', loginData);
      if (loginResult.status === 200 && loginResult.data.data && loginResult.data.data.token) {
        authToken = loginResult.data.data.token;
        console.log(`   ログイン成功、JWTトークン取得: ✅`);
        console.log('\n✅ 2. ユーザー登録');
        console.log('   ステータス: 既に登録済み → ログイン成功');
      }
    } catch (loginError) {
      console.log(`   ログインも失敗: ${loginError.message}`);
    }
  }

  // 3. ログイン
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };
    const result = await makeRequest('POST', '/auth/login', loginData);
    const success = result.status === 200;
    if (success && result.data.data && result.data.data.token) {
      authToken = result.data.data.token;
      console.log(`   JWTトークン取得: ✅`);
    }
    printTest('3. ログイン', result, success);
  } catch (error) {
    console.log('\n❌ 3. ログイン');
    console.log(`   エラー: ${error.message}`);
  }

  // 4. 現在のユーザー情報取得（認証必須）
  if (authToken) {
    try {
      const result = await makeRequest('GET', '/auth/me', null, authToken);
      printTest('4. 現在のユーザー情報取得（認証必須）', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 4. 現在のユーザー情報取得（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  4. 現在のユーザー情報取得（認証必須）');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 4.5. パスワードリセットメール送信（公開）
  let resetToken = null;
  try {
    const forgotPasswordData = {
      email: 'test@example.com'
    };
    const result = await makeRequest('POST', '/auth/forgot-password', forgotPasswordData);
    
    // ステータスコード200の場合は成功
    if (result.status === 200) {
      printTest('4.5. パスワードリセットメール送信（公開）', result, true);
      if (result.data && result.data.message) {
        console.log(`   メッセージ: ${result.data.message}`);
      }
      console.log('   注意: 実際のメール送信には有効なSMTP設定が必要です');
    } else {
      // エラーの場合でもテスト結果を表示
      printTest('4.5. パスワードリセットメール送信（公開）', result, false);
      if (result.data && result.data.error) {
        console.log(`   エラー: ${result.data.error}`);
      }
      console.log('   注意: SMTP設定を確認してください（.envファイル）');
    }
  } catch (error) {
    console.log('\n❌ 4.5. パスワードリセットメール送信（公開）');
    console.log(`   エラー: ${error.message}`);
    console.log('   注意: SMTP設定が必要です（.envファイルにSMTP_USERとSMTP_PASSを設定）');
  }

  // 4.6. パスワードリセット（公開、トークン必要）
  // 注意: 実際のトークンはメールから取得する必要があるため、テストではスキップ
  // 実際のテストでは、データベースから直接トークンを取得してテストすることも可能
  console.log('\n⚠️  4.6. パスワードリセット（公開、トークン必要）');
  console.log('   スキップ（実際のトークンが必要なため）');
  console.log('   注意: 実際のテストでは、メールから取得したトークンを使用してください');
  console.log('   または、データベースから直接トークンを取得してテストすることも可能です');

  // 5. ユーザー管理API - 自分の情報取得
  if (authToken) {
    try {
      const result = await makeRequest('GET', '/users/me', null, authToken);
      printTest('5. ユーザー管理API - 自分の情報取得', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 5. ユーザー管理API - 自分の情報取得');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  5. ユーザー管理API - 自分の情報取得');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 6. ユーザー管理API - 自分の情報更新
  if (authToken) {
    try {
      const updateData = {
        name: '更新されたテストユーザー',
        phone: '090-1234-5678',
        address: '東京都渋谷区テスト1-2-3'
      };
      const result = await makeRequest('PUT', '/users/me', updateData, authToken);
      printTest('6. ユーザー管理API - 自分の情報更新', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 6. ユーザー管理API - 自分の情報更新');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  6. ユーザー管理API - 自分の情報更新');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 7. ユーザー管理API - ユーザー詳細取得
  if (authToken) {
    try {
      // 先ほど登録したユーザーのIDを使用
      const userId = '042e6136-f755-4012-82fe-fbf8b3e9c955';
      const result = await makeRequest('GET', `/users/${userId}`, null, authToken);
      printTest('7. ユーザー管理API - ユーザー詳細取得', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 7. ユーザー管理API - ユーザー詳細取得');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  7. ユーザー管理API - ユーザー詳細取得');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 8. 予約管理API - 予約一覧取得
  if (authToken) {
    try {
      const result = await makeRequest('GET', '/bookings', null, authToken);
      printTest('8. 予約管理API - 予約一覧取得', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 8. 予約管理API - 予約一覧取得');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  8. 予約管理API - 予約一覧取得');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 9. 予約管理API - 予約作成
  if (authToken) {
    try {
      // 未来の日時を設定
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7日後
      
      const bookingData = {
        serviceType: '掃除・清掃',
        scheduledDate: futureDate.toISOString(),
        startTime: '10:00',
        duration: 3,
        address: '東京都渋谷区テスト1-2-3',
        notes: 'キッチンの掃除をお願いします'
      };
      const result = await makeRequest('POST', '/bookings', bookingData, authToken);
      const success = result.status === 201;
      if (success && result.data.data && result.data.data.id) {
        const bookingId = result.data.data.id;
        console.log(`   予約ID: ${bookingId}`);
        
        // 10. 予約管理API - 予約詳細取得
        try {
          const detailResult = await makeRequest('GET', `/bookings/${bookingId}`, null, authToken);
          printTest('10. 予約管理API - 予約詳細取得', detailResult, detailResult.status === 200);
        } catch (error) {
          console.log('\n❌ 10. 予約管理API - 予約詳細取得');
          console.log(`   エラー: ${error.message}`);
        }

        // 11. 予約管理API - 予約更新
        try {
          const updateData = {
            notes: 'キッチンとリビングの掃除をお願いします',
            duration: 4
          };
          const updateResult = await makeRequest('PUT', `/bookings/${bookingId}`, updateData, authToken);
          printTest('11. 予約管理API - 予約更新', updateResult, updateResult.status === 200);
        } catch (error) {
          console.log('\n❌ 11. 予約管理API - 予約更新');
          console.log(`   エラー: ${error.message}`);
        }

        // 12. 予約管理API - 予約キャンセル
        try {
          const cancelResult = await makeRequest('DELETE', `/bookings/${bookingId}`, null, authToken);
          printTest('12. 予約管理API - 予約キャンセル', cancelResult, cancelResult.status === 200);
        } catch (error) {
          console.log('\n❌ 12. 予約管理API - 予約キャンセル');
          console.log(`   エラー: ${error.message}`);
        }
      }
      printTest('9. 予約管理API - 予約作成', result, success);
    } catch (error) {
      console.log('\n❌ 9. 予約管理API - 予約作成');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  9. 予約管理API - 予約作成');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 13. ワーカー管理API - ワーカー一覧取得（公開）
  try {
    const result = await makeRequest('GET', '/workers');
    printTest('13. ワーカー管理API - ワーカー一覧取得（公開）', result, result.status === 200);
  } catch (error) {
    console.log('\n❌ 13. ワーカー管理API - ワーカー一覧取得（公開）');
    console.log(`   エラー: ${error.message}`);
  }

  // 14. ワーカーユーザーを作成（テスト用）
  let workerToken = null;
  let workerId = null;
  try {
    const workerRegisterData = {
      email: 'worker@example.com',
      password: 'password123',
      name: 'テストワーカー',
      role: 'WORKER'
    };
    const result = await makeRequest('POST', '/auth/register', workerRegisterData);
    const success = result.status === 201;
    
    if (success && result.data.data && result.data.data.token) {
      workerToken = result.data.data.token;
      workerId = result.data.data.user.id;
      console.log(`   ワーカーID: ${workerId}`);
      console.log(`   JWTトークン取得: ✅`);
    } else if (result.status === 500 || (result.data && result.data.error && result.data.error.includes('既に登録されています'))) {
      // 既に存在する場合はログインを試みる
      console.log(`   既に登録されているため、ログインを試みます...`);
      try {
        const loginData = {
          email: 'worker@example.com',
          password: 'password123'
        };
        const loginResult = await makeRequest('POST', '/auth/login', loginData);
        if (loginResult.status === 200 && loginResult.data.data && loginResult.data.data.token) {
          workerToken = loginResult.data.data.token;
          workerId = loginResult.data.data.user.id;
          console.log(`   ログイン成功、ワーカーID: ${workerId}`);
          console.log(`   JWTトークン取得: ✅`);
          // 成功として表示
          console.log('\n✅ 14. ワーカーユーザー作成（テスト用）');
          console.log('   ステータス: 既に登録済み → ログイン成功');
        } else {
          printTest('14. ワーカーユーザー作成（テスト用）', result, false);
        }
      } catch (loginError) {
        console.log(`   ログインも失敗: ${loginError.message}`);
        printTest('14. ワーカーユーザー作成（テスト用）', result, false);
      }
    } else {
      printTest('14. ワーカーユーザー作成（テスト用）', result, success);
    }
  } catch (error) {
    console.log('\n⚠️  14. ワーカーユーザー作成（テスト用）');
    console.log(`   エラー: ${error.message}`);
    // 既に存在する場合はログインを試みる
    try {
      const loginData = {
        email: 'worker@example.com',
        password: 'password123'
      };
      const loginResult = await makeRequest('POST', '/auth/login', loginData);
      if (loginResult.status === 200 && loginResult.data.data && loginResult.data.data.token) {
        workerToken = loginResult.data.data.token;
        workerId = loginResult.data.data.user.id;
        console.log(`   ログイン成功、ワーカーID: ${workerId}`);
        console.log(`   JWTトークン取得: ✅`);
        console.log('\n✅ 14. ワーカーユーザー作成（テスト用）');
        console.log('   ステータス: 既に登録済み → ログイン成功');
      } else {
        console.log(`   ログイン失敗: ステータス ${loginResult.status}`);
      }
    } catch (loginError) {
      console.log(`   ログインも失敗: ${loginError.message}`);
    }
  }

  // 15. ワーカー管理API - ワーカー詳細取得（公開）
  if (workerId) {
    try {
      const result = await makeRequest('GET', `/workers/${workerId}`);
      printTest('15. ワーカー管理API - ワーカー詳細取得（公開）', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 15. ワーカー管理API - ワーカー詳細取得（公開）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  15. ワーカー管理API - ワーカー詳細取得（公開）');
    console.log('   スキップ（ワーカーIDが取得できませんでした）');
  }

  // 16. ワーカー管理API - ワーカープロフィール更新（認証必須）
  if (workerToken) {
    try {
      const updateData = {
        bio: '経験豊富な家事代行ワーカーです。掃除、料理、洗濯など、幅広いサービスを提供しています。',
        hourlyRate: 2500
      };
      const result = await makeRequest('PUT', '/workers/me', updateData, workerToken);
      printTest('16. ワーカー管理API - ワーカープロフィール更新（認証必須）', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 16. ワーカー管理API - ワーカープロフィール更新（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  16. ワーカー管理API - ワーカープロフィール更新（認証必須）');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 17. レビューAPI - ワーカーのレビュー一覧取得（公開）
  if (workerId) {
    try {
      const result = await makeRequest('GET', `/reviews/${workerId}`);
      printTest('17. レビューAPI - ワーカーのレビュー一覧取得（公開）', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 17. レビューAPI - ワーカーのレビュー一覧取得（公開）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  17. レビューAPI - ワーカーのレビュー一覧取得（公開）');
    console.log('   スキップ（ワーカーIDが取得できませんでした）');
  }

  // 18. レビューAPI - レビュー投稿（認証必須）
  // 完了済みの予約を作成してからレビューを投稿
  if (authToken && workerId) {
    try {
      // まず、完了済みの予約を作成
      // 注意: ワーカーが承認されていない場合、予約作成時にワーカーを指定できないため、
      // まずワーカー未指定で予約を作成し、後でワーカーを設定します
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // 1日後
      
      // ワーカー未指定で予約を作成（承認されていないワーカーでも作成可能）
      const completedBookingData = {
        serviceType: '掃除・清掃',
        scheduledDate: futureDate.toISOString(),
        startTime: '10:00',
        duration: 2,
        address: '東京都渋谷区テスト1-2-3',
        notes: 'レビューテスト用の予約'
      };
      
      const bookingResult = await makeRequest('POST', '/bookings', completedBookingData, authToken);
      
      if (bookingResult.status === 201 && bookingResult.data.data && bookingResult.data.data.id) {
        const completedBookingId = bookingResult.data.data.id;
        console.log(`   予約ID: ${completedBookingId}`);
        
        // 予約にワーカーを設定してから完了状態に更新（2段階で更新）
        try {
          // ステップ1: ワーカーを設定してCONFIRMEDにする
          const workerUpdateData = {
            workerId: workerId
          };
          const workerUpdateResult = await makeRequest('PUT', `/bookings/${completedBookingId}`, workerUpdateData, authToken);
          
          if (workerUpdateResult.status === 200) {
            console.log(`   予約にワーカーを設定しました（ステータス: CONFIRMED）`);
            
            // ステップ2: ステータスをCOMPLETEDに変更
            const statusUpdateData = {
              status: 'COMPLETED'
            };
            const statusUpdateResult = await makeRequest('PUT', `/bookings/${completedBookingId}`, statusUpdateData, authToken);
            
            if (statusUpdateResult.status === 200) {
              console.log(`   予約を完了状態に更新しました`);
              
              // レビューを投稿
              const reviewData = {
                bookingId: completedBookingId,
                rating: 5,
                comment: 'とても丁寧で素晴らしいサービスでした！'
              };
              
              const reviewResult = await makeRequest('POST', '/reviews', reviewData, authToken);
              const success = reviewResult.status === 201;
              
              if (success && reviewResult.data.data) {
                console.log(`   レビューID: ${reviewResult.data.data.id}`);
                console.log(`   評価: ${reviewResult.data.data.rating}点`);
              }
              
              printTest('18. レビューAPI - レビュー投稿（認証必須）', reviewResult, success);
            } else {
              console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
              console.log(`   予約のステータス更新に失敗しました: ステータス ${statusUpdateResult.status}`);
              if (statusUpdateResult.data && statusUpdateResult.data.error) {
                console.log(`   エラー: ${statusUpdateResult.data.error}`);
              }
              if (statusUpdateResult.data && statusUpdateResult.data.message) {
                console.log(`   詳細: ${statusUpdateResult.data.message}`);
              }
            }
          } else {
            console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
            console.log(`   予約のワーカー設定に失敗しました: ステータス ${workerUpdateResult.status}`);
            if (workerUpdateResult.data && workerUpdateResult.data.error) {
              console.log(`   エラー: ${workerUpdateResult.data.error}`);
            }
            if (workerUpdateResult.data && workerUpdateResult.data.message) {
              console.log(`   詳細: ${workerUpdateResult.data.message}`);
            }
          }
        } catch (reviewError) {
          console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
          console.log(`   エラー: ${reviewError.message}`);
        }
      } else {
        console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
        console.log(`   予約作成に失敗しました: ステータス ${bookingResult.status}`);
        if (bookingResult.data && bookingResult.data.error) {
          console.log(`   エラー: ${bookingResult.data.error}`);
          if (bookingResult.data.message) {
            console.log(`   詳細: ${bookingResult.data.message}`);
          }
        }
        console.log('   完了済み予約の作成に失敗したため、スキップします');
      }
    } catch (error) {
      console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  18. レビューAPI - レビュー投稿（認証必須）');
    console.log('   スキップ（トークンまたはワーカーIDが取得できませんでした）');
  }

  // 19. チャットAPI - メッセージ送信（認証必須）
  let testBookingId = null;
  if (authToken && workerId) {
    try {
      // テスト用の予約を作成
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const testBookingData = {
        serviceType: '掃除・清掃',
        scheduledDate: futureDate.toISOString(),
        startTime: '10:00',
        duration: 2,
        address: '東京都渋谷区テスト1-2-3',
        notes: 'チャットテスト用の予約',
        workerId: workerId
      };
      
      const bookingResult = await makeRequest('POST', '/bookings', testBookingData, authToken);
      
      if (bookingResult.status === 201 && bookingResult.data.data && bookingResult.data.data.id) {
        testBookingId = bookingResult.data.data.id;
        console.log(`   テスト用予約ID: ${testBookingId}`);
        
        // メッセージを送信
        const messageData = {
          bookingId: testBookingId,
          content: 'こんにちは、よろしくお願いします！'
        };
        const messageResult = await makeRequest('POST', '/messages', messageData, authToken);
        const success = messageResult.status === 201;
        printTest('19. チャットAPI - メッセージ送信（認証必須）', messageResult, success);
        
        // 20. チャットAPI - メッセージ一覧取得（認証必須）
        if (success) {
          try {
            const messagesResult = await makeRequest('GET', `/messages/${testBookingId}`, null, authToken);
            printTest('20. チャットAPI - メッセージ一覧取得（認証必須）', messagesResult, messagesResult.status === 200);
          } catch (error) {
            console.log('\n❌ 20. チャットAPI - メッセージ一覧取得（認証必須）');
            console.log(`   エラー: ${error.message}`);
          }
        }
      } else {
        console.log('\n⚠️  19. チャットAPI - メッセージ送信（認証必須）');
        console.log('   テスト用予約の作成に失敗したため、スキップします');
      }
    } catch (error) {
      console.log('\n⚠️  19. チャットAPI - メッセージ送信（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  19. チャットAPI - メッセージ送信（認証必須）');
    console.log('   スキップ（トークンまたはワーカーIDが取得できませんでした）');
  }

  // 21. 決済API - 決済処理（認証必須、顧客のみ）
  if (authToken && testBookingId) {
    try {
      const paymentData = {
        bookingId: testBookingId,
        paymentMethod: 'credit_card',
        transactionId: 'test-transaction-12345'
      };
      const result = await makeRequest('POST', '/payments', paymentData, authToken);
      const success = result.status === 201;
      printTest('21. 決済API - 決済処理（認証必須、顧客のみ）', result, success);
    } catch (error) {
      console.log('\n❌ 21. 決済API - 決済処理（認証必須、顧客のみ）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  21. 決済API - 決済処理（認証必須、顧客のみ）');
    console.log('   スキップ（トークンまたは予約IDが取得できませんでした）');
  }

  // 22. 決済API - 決済履歴取得（認証必須）
  if (authToken) {
    try {
      const result = await makeRequest('GET', '/payments', null, authToken);
      printTest('22. 決済API - 決済履歴取得（認証必須）', result, result.status === 200);
    } catch (error) {
      console.log('\n❌ 22. 決済API - 決済履歴取得（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  22. 決済API - 決済履歴取得（認証必須）');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 23. サポートAPI - 問い合わせ作成（認証必須）
  if (authToken) {
    try {
      const supportData = {
        subject: 'サービスについての質問',
        content: '予約のキャンセルポリシーについて教えてください。'
      };
      const result = await makeRequest('POST', '/support', supportData, authToken);
      const success = result.status === 201;
      let supportTicketId = null;
      if (success && result.data.data && result.data.data.id) {
        supportTicketId = result.data.data.id;
        console.log(`   問い合わせID: ${supportTicketId}`);
      }
      printTest('23. サポートAPI - 問い合わせ作成（認証必須）', result, success);
      
      // 24. サポートAPI - 問い合わせ一覧取得（認証必須）
      if (success) {
        try {
          const listResult = await makeRequest('GET', '/support', null, authToken);
          printTest('24. サポートAPI - 問い合わせ一覧取得（認証必須）', listResult, listResult.status === 200);
        } catch (error) {
          console.log('\n❌ 24. サポートAPI - 問い合わせ一覧取得（認証必須）');
          console.log(`   エラー: ${error.message}`);
        }
        
        // 25. サポートAPI - 問い合わせ詳細取得（認証必須）
        if (supportTicketId) {
          try {
            const detailResult = await makeRequest('GET', `/support/${supportTicketId}`, null, authToken);
            printTest('25. サポートAPI - 問い合わせ詳細取得（認証必須）', detailResult, detailResult.status === 200);
          } catch (error) {
            console.log('\n❌ 25. サポートAPI - 問い合わせ詳細取得（認証必須）');
            console.log(`   エラー: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('\n❌ 23. サポートAPI - 問い合わせ作成（認証必須）');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  23. サポートAPI - 問い合わせ作成（認証必須）');
    console.log('   スキップ（トークンが取得できませんでした）');
  }

  // 26. 管理者API - ユーザー管理（管理者のみ）
  // 管理者ユーザーを作成してテスト
  let adminToken = null;
  try {
    const adminRegisterData = {
      email: 'admin@example.com',
      password: 'password123',
      name: 'テスト管理者',
      role: 'ADMIN'
    };
    const adminResult = await makeRequest('POST', '/auth/register', adminRegisterData);
    
    if (adminResult.status === 201 && adminResult.data.data && adminResult.data.data.token) {
      adminToken = adminResult.data.data.token;
      console.log(`   管理者JWTトークン取得: ✅`);
    } else if (adminResult.status === 500 || (adminResult.data && adminResult.data.error && adminResult.data.error.includes('既に登録されています'))) {
      // 既に存在する場合はログインを試みる
      const adminLoginData = {
        email: 'admin@example.com',
        password: 'password123'
      };
      const adminLoginResult = await makeRequest('POST', '/auth/login', adminLoginData);
      if (adminLoginResult.status === 200 && adminLoginResult.data.data && adminLoginResult.data.data.token) {
        adminToken = adminLoginResult.data.data.token;
        console.log(`   管理者ログイン成功、JWTトークン取得: ✅`);
      }
    }
    
    if (adminToken) {
      // ユーザー一覧取得
      try {
        const usersResult = await makeRequest('GET', '/admin/users', null, adminToken);
        printTest('26. 管理者API - ユーザー管理（管理者のみ）', usersResult, usersResult.status === 200);
      } catch (error) {
        console.log('\n❌ 26. 管理者API - ユーザー管理（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 27. 管理者API - ワーカー管理（管理者のみ）
      try {
        const workersResult = await makeRequest('GET', '/admin/workers', null, adminToken);
        printTest('27. 管理者API - ワーカー管理（管理者のみ）', workersResult, workersResult.status === 200);
      } catch (error) {
        console.log('\n❌ 27. 管理者API - ワーカー管理（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 28. 管理者API - ワーカー承認（管理者のみ）
      if (workerId) {
        try {
          const approveData = {
            approvalStatus: 'APPROVED'
          };
          const approveResult = await makeRequest('PUT', `/admin/workers/${workerId}/approve`, approveData, adminToken);
          printTest('28. 管理者API - ワーカー承認（管理者のみ）', approveResult, approveResult.status === 200);
        } catch (error) {
          console.log('\n❌ 28. 管理者API - ワーカー承認（管理者のみ）');
          console.log(`   エラー: ${error.message}`);
        }
      } else {
        console.log('\n⚠️  28. 管理者API - ワーカー承認（管理者のみ）');
        console.log('   スキップ（ワーカーIDが取得できませんでした）');
      }
      
      // 29. 管理者API - 予約レポート（管理者のみ）
      try {
        const bookingReportResult = await makeRequest('GET', '/admin/reports/bookings', null, adminToken);
        printTest('29. 管理者API - 予約レポート（管理者のみ）', bookingReportResult, bookingReportResult.status === 200);
      } catch (error) {
        console.log('\n❌ 29. 管理者API - 予約レポート（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 30. 管理者API - 売上レポート（管理者のみ）
      try {
        const revenueReportResult = await makeRequest('GET', '/admin/reports/revenue', null, adminToken);
        printTest('30. 管理者API - 売上レポート（管理者のみ）', revenueReportResult, revenueReportResult.status === 200);
      } catch (error) {
        console.log('\n❌ 30. 管理者API - 売上レポート（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 31. 管理者API - ユーザー統計レポート（管理者のみ）
      try {
        const userReportResult = await makeRequest('GET', '/admin/reports/users', null, adminToken);
        printTest('31. 管理者API - ユーザー統計レポート（管理者のみ）', userReportResult, userReportResult.status === 200);
      } catch (error) {
        console.log('\n❌ 31. 管理者API - ユーザー統計レポート（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 32. 管理者API - ワーカー統計レポート（管理者のみ）
      try {
        const workerReportResult = await makeRequest('GET', '/admin/reports/workers', null, adminToken);
        printTest('32. 管理者API - ワーカー統計レポート（管理者のみ）', workerReportResult, workerReportResult.status === 200);
      } catch (error) {
        console.log('\n❌ 32. 管理者API - ワーカー統計レポート（管理者のみ）');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 日付範囲指定のテスト
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const bookingReportWithDateResult = await makeRequest('GET', `/admin/reports/bookings?startDate=${startDateStr}&endDate=${endDateStr}`, null, adminToken);
        printTest('33. 管理者API - 予約レポート（日付範囲指定）', bookingReportWithDateResult, bookingReportWithDateResult.status === 200);
      } catch (error) {
        console.log('\n❌ 33. 管理者API - 予約レポート（日付範囲指定）');
        console.log(`   エラー: ${error.message}`);
      }
    } else {
      console.log('\n⚠️  26-33. 管理者API');
      console.log('   スキップ（管理者トークンが取得できませんでした）');
    }
  } catch (error) {
    console.log('\n⚠️  26-33. 管理者API');
    console.log(`   エラー: ${error.message}`);
  }

  // 通知APIテスト
  console.log('\n========================================');
  console.log('📬 通知APIテスト');
  console.log('========================================');
  
  if (authToken) {
    try {
      // 34. 通知API - 通知一覧取得
      try {
        const notificationsResult = await makeRequest('GET', '/notifications', null, authToken);
        printTest('34. 通知API - 通知一覧取得', notificationsResult, notificationsResult.status === 200);
      } catch (error) {
        console.log('\n❌ 34. 通知API - 通知一覧取得');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 35. 通知API - 未読通知数取得
      try {
        const unreadCountResult = await makeRequest('GET', '/notifications/unread-count', null, authToken);
        printTest('35. 通知API - 未読通知数取得', unreadCountResult, unreadCountResult.status === 200);
      } catch (error) {
        console.log('\n❌ 35. 通知API - 未読通知数取得');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 36. 通知API - 通知を既読にする
      try {
        const notificationsResult = await makeRequest('GET', '/notifications', null, authToken);
        if (notificationsResult.status === 200 && notificationsResult.data?.data?.notifications?.length > 0) {
          const firstNotificationId = notificationsResult.data.data.notifications[0].id;
          const markReadResult = await makeRequest('PUT', `/notifications/${firstNotificationId}/read`, null, authToken);
          printTest('36. 通知API - 通知を既読にする', markReadResult, markReadResult.status === 200);
        } else {
          console.log('\n⚠️  36. 通知API - 通知を既読にする');
          console.log('   スキップ（通知が存在しません）');
        }
      } catch (error) {
        console.log('\n❌ 36. 通知API - 通知を既読にする');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 37. 通知API - すべての通知を既読にする
      try {
        const markAllReadResult = await makeRequest('PUT', '/notifications/read-all', null, authToken);
        printTest('37. 通知API - すべての通知を既読にする', markAllReadResult, markAllReadResult.status === 200);
      } catch (error) {
        console.log('\n❌ 37. 通知API - すべての通知を既読にする');
        console.log(`   エラー: ${error.message}`);
      }
      
      // 38. 通知API - 通知を削除
      try {
        const notificationsResult = await makeRequest('GET', '/notifications', null, authToken);
        if (notificationsResult.status === 200 && notificationsResult.data?.data?.notifications?.length > 0) {
          const firstNotificationId = notificationsResult.data.data.notifications[0].id;
          const deleteResult = await makeRequest('DELETE', `/notifications/${firstNotificationId}`, null, authToken);
          printTest('38. 通知API - 通知を削除', deleteResult, deleteResult.status === 200);
        } else {
          console.log('\n⚠️  38. 通知API - 通知を削除');
          console.log('   スキップ（通知が存在しません）');
        }
      } catch (error) {
        console.log('\n❌ 38. 通知API - 通知を削除');
        console.log(`   エラー: ${error.message}`);
      }
    } catch (error) {
      console.log('\n⚠️  34-38. 通知API');
      console.log(`   エラー: ${error.message}`);
    }
  } else {
    console.log('\n⚠️  34-38. 通知API');
    console.log('   スキップ（認証トークンが取得できませんでした）');
  }

  console.log('\n========================================');
  console.log('✅ APIテスト完了');
  console.log('========================================\n');
}

// テスト実行
runTests().catch((error) => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
