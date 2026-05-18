/**
 * Stripe β版スモークテスト
 *
 * 必須環境変数:
 * - BASE_URL: 例 http://localhost:3000
 * - CUSTOMER_EMAIL
 * - CUSTOMER_PASSWORD
 * - BOOKING_ID: CONFIRMED または IN_PROGRESS の予約ID
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD;
const BOOKING_ID = process.env.BOOKING_ID;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('/api') ? path : `/api${path}`, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    const body = data ? JSON.stringify(data) : null;

    const req = client.request({
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        ...(body && { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }),
        ...(token && { Authorization: `Bearer ${token}` })
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  if (!CUSTOMER_EMAIL || !CUSTOMER_PASSWORD || !BOOKING_ID) {
    throw new Error('CUSTOMER_EMAIL, CUSTOMER_PASSWORD, BOOKING_ID を設定してください。');
  }

  const login = await request('POST', '/auth/login', {
    email: CUSTOMER_EMAIL,
    password: CUSTOMER_PASSWORD
  });
  assert(login.status === 200 && login.data?.data?.token, 'ログインに失敗しました');
  const token = login.data.data.token;

  const adminRegister = await request('POST', '/auth/register', {
    email: `admin-test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Admin Test',
    role: 'ADMIN'
  });
  assert(adminRegister.status === 403, '公開登録APIでADMIN作成が拒否されていません');

  const oldPayment = await request('POST', '/payments', {
    bookingId: BOOKING_ID,
    paymentMethod: 'credit_card'
  }, token);
  assert(oldPayment.status === 410, '旧決済APIが410を返していません');

  const oldCard = await request('POST', '/cards', {
    cardNumber: '4242424242424242',
    expiryMonth: 12,
    expiryYear: 2030,
    cardholderName: 'TEST USER'
  }, token);
  assert(oldCard.status === 410, 'カード番号POST APIが410を返していません');

  const intent = await request('POST', '/payments/intent', {
    bookingId: BOOKING_ID
  }, token);
  assert(intent.status === 201, `PaymentIntent作成に失敗しました: ${JSON.stringify(intent.data)}`);
  assert(intent.data?.data?.clientSecret, 'clientSecretが返却されていません');

  console.log('Stripe β版スモークテストに成功しました');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
