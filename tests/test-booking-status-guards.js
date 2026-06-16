const assert = require('assert');

const emailPath = require.resolve('../src/services/emailService');
const notificationPath = require.resolve('../src/services/notificationService');

require.cache[emailPath] = {
  id: emailPath,
  filename: emailPath,
  loaded: true,
  exports: {
    sendBookingConfirmationEmail: async () => {},
    sendBookingUpdateEmail: async () => {},
  },
};

require.cache[notificationPath] = {
  id: notificationPath,
  filename: notificationPath,
  loaded: true,
  exports: {
    createNotification: async () => ({}),
  },
};

const bookingService = require('../src/services/bookingService');
const prisma = require('../src/config/database');

const futureDate = '2030-01-01T01:00:00.000Z';

let currentBooking;
let lastUpdateData;
let overlappingBookings = [];

const makeBooking = (overrides = {}) => ({
  id: 'booking-1',
  customerId: 'customer-1',
  workerId: null,
  serviceType: '掃除',
  scheduledDate: futureDate,
  startTime: '10:00',
  duration: 2,
  address: '札幌市中央区南1条',
  notes: null,
  status: 'PENDING',
  totalAmount: null,
  completedAt: null,
  customer: {
    id: 'customer-1',
    name: '依頼者',
    email: 'customer@example.com',
    phone: '090-1111-1111',
    address: '札幌市中央区',
  },
  worker: null,
  review: null,
  payment: null,
  ...overrides,
});

async function expectErrorStatus(promise, status, messagePart) {
  await assert.rejects(promise, (error) => {
    assert.strictEqual(error.status, status);
    if (messagePart) {
      assert.match(error.message, new RegExp(messagePart));
    }
    return true;
  });
}

async function run() {
  const originals = {
    bookingFindUnique: prisma.booking.findUnique,
    bookingFindMany: prisma.booking.findMany,
    bookingUpdate: prisma.booking.update,
    userFindUnique: prisma.user.findUnique,
    slotFindMany: prisma.workerUnavailableSlot.findMany,
  };

  try {
    prisma.booking.findUnique = async () => currentBooking;
    prisma.booking.findMany = async () => overlappingBookings;
    prisma.booking.update = async ({ data }) => {
      lastUpdateData = data;
      return {
        ...currentBooking,
        ...data,
        workerId: data.workerId === undefined ? currentBooking.workerId : data.workerId,
        customer: currentBooking.customer,
        worker:
          (data.workerId || currentBooking.workerId)
            ? {
                id: data.workerId || currentBooking.workerId,
                name: 'ワーカー',
                email: 'worker@example.com',
                hourlyRate: 2500,
                files: [],
              }
            : null,
        review: null,
        payment: null,
      };
    };
    prisma.user.findUnique = async () => ({
      id: 'worker-1',
      role: 'WORKER',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      serviceAreaText: JSON.stringify({ v: 1, rows: [{ pref: '北海道', city: '札幌市', ward: '中央区' }] }),
      availabilityText: JSON.stringify({ v: 1, days: [{ key: 'tue', closed: false, start: '09:00', end: '18:00' }] }),
    });
    prisma.workerUnavailableSlot.findMany = async () => [];

    currentBooking = makeBooking({ status: 'CONFIRMED' });
    await expectErrorStatus(
      bookingService.updateBooking(currentBooking.id, 'customer-1', 'CUSTOMER', { status: 'COMPLETED' }),
      403,
      '専用API'
    );
    assert.strictEqual(lastUpdateData, undefined);

    currentBooking = makeBooking({
      workerId: 'worker-1',
      status: 'CONFIRMED',
      worker: { id: 'worker-1', name: 'ワーカー', email: 'worker@example.com', files: [] },
    });
    await expectErrorStatus(
      bookingService.updateBooking(currentBooking.id, 'worker-1', 'WORKER', { status: 'COMPLETED' }),
      403,
      '専用API'
    );

    currentBooking = makeBooking({ status: 'CONFIRMED' });
    lastUpdateData = undefined;
    const adminUpdated = await bookingService.updateBooking(currentBooking.id, 'admin-1', 'ADMIN', {
      status: 'COMPLETED',
    });
    assert.strictEqual(adminUpdated.status, 'COMPLETED');
    assert.deepStrictEqual(lastUpdateData, { status: 'COMPLETED' });

    currentBooking = makeBooking();
    lastUpdateData = undefined;
    const detailUpdated = await bookingService.updateBooking(currentBooking.id, 'customer-1', 'CUSTOMER', {
      notes: '玄関前にお願いします',
    });
    assert.strictEqual(detailUpdated.notes, '玄関前にお願いします');
    assert.deepStrictEqual(lastUpdateData, { notes: '玄関前にお願いします' });

    currentBooking = makeBooking();
    lastUpdateData = undefined;
    overlappingBookings = [];
    const assigned = await bookingService.updateBooking(currentBooking.id, 'customer-1', 'CUSTOMER', {
      workerId: 'worker-1',
    });
    assert.strictEqual(assigned.workerId, 'worker-1');
    assert.strictEqual(assigned.status, 'CONFIRMED');
    assert.deepStrictEqual(lastUpdateData, { workerId: 'worker-1', status: 'CONFIRMED' });

    currentBooking = makeBooking();
    lastUpdateData = undefined;
    overlappingBookings = [
      {
        id: 'booking-2',
        workerId: 'worker-1',
        scheduledDate: '2030-01-01T01:30:00.000Z',
        startTime: '10:30',
        duration: 2,
        status: 'CONFIRMED',
      },
    ];
    await expectErrorStatus(
      bookingService.updateBooking(currentBooking.id, 'customer-1', 'CUSTOMER', { workerId: 'worker-1' }),
      409,
      '対応できなくなりました'
    );
  } finally {
    prisma.booking.findUnique = originals.bookingFindUnique;
    prisma.booking.findMany = originals.bookingFindMany;
    prisma.booking.update = originals.bookingUpdate;
    prisma.user.findUnique = originals.userFindUnique;
    prisma.workerUnavailableSlot.findMany = originals.slotFindMany;
  }
}

run()
  .then(() => {
    console.log('Booking status guard tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
