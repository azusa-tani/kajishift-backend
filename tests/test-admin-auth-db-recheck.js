const assert = require('assert');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-with-enough-length';

const prisma = require('../src/config/database');
const { authenticate } = require('../src/middleware/auth');

const signToken = (payload, options = {}) => jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '1h',
  ...options
});

const runAuthenticate = (token) => new Promise((resolve, reject) => {
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      resolve({ req, statusCode: this.statusCode, body });
    }
  };

  const maybePromise = authenticate(req, res, () => resolve({ req, nextCalled: true }));
  if (maybePromise && typeof maybePromise.catch === 'function') {
    maybePromise.catch(reject);
  }
});

async function run() {
  const originalFindUnique = prisma.user.findUnique;
  let findUniqueCalls = [];

  const setFindUnique = (handler) => {
    findUniqueCalls = [];
    prisma.user.findUnique = async (args) => {
      findUniqueCalls.push(args);
      return handler(args);
    };
  };

  try {
    setFindUnique(async () => ({ id: 'admin-1', role: 'ADMIN', status: 'ACTIVE' }));
    const activeAdminToken = signToken({
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      customClaim: 'preserved'
    });
    const activeAdmin = await runAuthenticate(activeAdminToken);
    assert.strictEqual(activeAdmin.nextCalled, true);
    assert.strictEqual(findUniqueCalls.length, 1);
    assert.deepStrictEqual(findUniqueCalls[0], {
      where: { id: 'admin-1' },
      select: { id: true, role: true, status: true }
    });
    assert.strictEqual(activeAdmin.req.user.id, 'admin-1');
    assert.strictEqual(activeAdmin.req.user.email, 'admin@example.com');
    assert.strictEqual(activeAdmin.req.user.role, 'ADMIN');
    assert.strictEqual(activeAdmin.req.user.status, 'ACTIVE');
    assert.strictEqual(activeAdmin.req.user.customClaim, 'preserved');
    assert.strictEqual(typeof activeAdmin.req.user.iat, 'number');
    assert.strictEqual(typeof activeAdmin.req.user.exp, 'number');
    assert.strictEqual(activeAdmin.req.tokenClaims.customClaim, 'preserved');

    setFindUnique(async () => null);
    const missingAdmin = await runAuthenticate(signToken({ id: 'missing-admin', email: 'admin@example.com', role: 'ADMIN' }));
    assert.strictEqual(missingAdmin.statusCode, 401);
    assert.strictEqual(missingAdmin.body.error, 'Authentication Error');

    setFindUnique(async () => ({ id: 'admin-1', role: 'ADMIN', status: 'SUSPENDED' }));
    const suspendedAdmin = await runAuthenticate(signToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }));
    assert.strictEqual(suspendedAdmin.statusCode, 401);
    assert.strictEqual(suspendedAdmin.body.error, 'Authentication Error');

    setFindUnique(async () => ({ id: 'admin-1', role: 'CUSTOMER', status: 'ACTIVE' }));
    const demotedAdmin = await runAuthenticate(signToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }));
    assert.strictEqual(demotedAdmin.statusCode, 401);
    assert.strictEqual(demotedAdmin.body.error, 'Authentication Error');

    setFindUnique(async () => {
      throw new Error('database unavailable');
    });
    const dbErrorAdmin = await runAuthenticate(signToken({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }));
    assert.strictEqual(dbErrorAdmin.statusCode, 500);
    assert.strictEqual(dbErrorAdmin.body.error, 'Internal Server Error');
    assert.strictEqual(dbErrorAdmin.body.message, '認証処理中にエラーが発生しました');

    setFindUnique(async () => {
      throw new Error('CUSTOMER should not query the database');
    });
    const customerToken = signToken({ id: 'customer-1', email: 'customer@example.com', role: 'CUSTOMER' });
    const customer = await runAuthenticate(customerToken);
    assert.strictEqual(customer.nextCalled, true);
    assert.strictEqual(findUniqueCalls.length, 0);
    assert.strictEqual(customer.req.user.role, 'CUSTOMER');
    assert.strictEqual(customer.req.user.email, 'customer@example.com');

    setFindUnique(async () => {
      throw new Error('WORKER should not query the database');
    });
    const workerToken = signToken({ id: 'worker-1', email: 'worker@example.com', role: 'WORKER' });
    const worker = await runAuthenticate(workerToken);
    assert.strictEqual(worker.nextCalled, true);
    assert.strictEqual(findUniqueCalls.length, 0);
    assert.strictEqual(worker.req.user.role, 'WORKER');
    assert.strictEqual(worker.req.user.email, 'worker@example.com');

    setFindUnique(async () => {
      throw new Error('invalid JWT should not query the database');
    });
    const invalidJwt = await runAuthenticate('invalid.jwt');
    assert.strictEqual(invalidJwt.statusCode, 401);
    assert.strictEqual(invalidJwt.body.message, '無効なトークンです');
    assert.strictEqual(findUniqueCalls.length, 0);

    const expiredToken = signToken(
      { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      { expiresIn: -1 }
    );
    const expiredJwt = await runAuthenticate(expiredToken);
    assert.strictEqual(expiredJwt.statusCode, 401);
    assert.strictEqual(expiredJwt.body.message, 'トークンの有効期限が切れています');
    assert.strictEqual(findUniqueCalls.length, 0);
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
}

run()
  .then(() => {
    console.log('Admin auth DB recheck tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
