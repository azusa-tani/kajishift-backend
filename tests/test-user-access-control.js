const assert = require('assert');

const userService = require('../src/services/userService');
const prisma = require('../src/config/database');

const customer = {
  id: 'customer-1',
  email: 'customer@example.com',
  password: 'hashed-password',
  name: '依頼者',
  phone: '090-1111-1111',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  address: '札幌市中央区',
  bio: null,
  hourlyRate: null,
  serviceAreaText: null,
  availabilityText: null,
  bankName: null,
  branchName: null,
  accountType: null,
  accountNumber: null,
  accountName: null,
  notificationPrefs: null,
  rating: 0,
  reviewCount: 0,
  approvalStatus: 'PENDING',
  createdAt: new Date('2026-06-16T00:00:00.000Z'),
  updatedAt: new Date('2026-06-16T00:00:00.000Z'),
};

const worker = {
  id: 'worker-1',
  email: 'worker@example.com',
  password: 'hashed-password',
  name: 'ワーカー',
  phone: '090-2222-2222',
  role: 'WORKER',
  status: 'ACTIVE',
  address: '札幌市北区',
  bio: '自己紹介',
  hourlyRate: 2500,
  serviceAreaText: '{}',
  availabilityText: '{}',
  bankName: 'テスト銀行',
  branchName: '札幌支店',
  accountType: 'ordinary',
  accountNumber: '1234567',
  accountName: 'カジ シフト',
  notificationPrefs: null,
  rating: 4.8,
  reviewCount: 12,
  approvalStatus: 'APPROVED',
  createdAt: new Date('2026-06-16T00:00:00.000Z'),
  updatedAt: new Date('2026-06-16T00:00:00.000Z'),
};

const usersById = new Map([
  [customer.id, customer],
  [worker.id, worker],
]);

async function expectForbidden(promise) {
  await assert.rejects(promise, (error) => {
    assert.strictEqual(error.status, 403);
    return true;
  });
}

async function run() {
  const originalFindUnique = prisma.user.findUnique;

  try {
    prisma.user.findUnique = async ({ where }) => usersById.get(where.id) || null;

    const self = await userService.getUserByIdForRequester(worker.id, {
      id: worker.id,
      role: 'WORKER',
    });
    assert.strictEqual(self.id, worker.id);
    assert.strictEqual(self.bankName, worker.bankName);
    assert.strictEqual(self.accountNumber, worker.accountNumber);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(self, 'password'), false);

    await expectForbidden(
      userService.getUserByIdForRequester(worker.id, {
        id: customer.id,
        role: 'CUSTOMER',
      })
    );

    await expectForbidden(
      userService.getUserByIdForRequester(customer.id, {
        id: worker.id,
        role: 'WORKER',
      })
    );

    const adminView = await userService.getUserByIdForRequester(worker.id, {
      id: 'admin-1',
      role: 'ADMIN',
    });
    assert.strictEqual(adminView.id, worker.id);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(adminView, 'password'), false);
    for (const field of ['bankName', 'branchName', 'accountType', 'accountNumber', 'accountName']) {
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(adminView, field),
        false,
        `${field} should not be returned for admin /api/users/:id view`
      );
    }
  } finally {
    prisma.user.findUnique = originalFindUnique;
  }
}

run()
  .then(() => {
    console.log('User access control tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
