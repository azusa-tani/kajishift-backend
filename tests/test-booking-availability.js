const assert = require('assert');

const bookingService = require('../src/services/bookingService');
const prisma = require('../src/config/database');

const {
  _availabilityHelpers: {
    getBookingRange,
    isWithinAvailabilityText,
    isWithinServiceAreaText,
  },
} = bookingService;

const makeBooking = (scheduledDate, duration = 2, address = '札幌市中央区南1条') => ({
  id: 'booking-1',
  scheduledDate,
  startTime: '10:00',
  duration,
  address,
});

const mon1000Jst = '2026-06-15T01:00:00.000Z';
const range = getBookingRange(makeBooking(mon1000Jst, 2));

const availability = JSON.stringify({
  v: 1,
  days: [
    { key: 'mon', closed: false, start: '09:00', end: '13:00' },
    { key: 'tue', closed: true, start: '09:00', end: '18:00' },
  ],
});

assert.strictEqual(isWithinAvailabilityText(availability, range), true);

const tooShort = JSON.stringify({
  v: 1,
  days: [{ key: 'mon', closed: false, start: '13:00', end: '18:00' }],
});
assert.strictEqual(isWithinAvailabilityText(tooShort, range), false);

const closed = JSON.stringify({
  v: 1,
  days: [{ key: 'mon', closed: true, start: '09:00', end: '18:00' }],
});
assert.strictEqual(isWithinAvailabilityText(closed, range), false);

const malformedAvailability = '月曜 9:00-18:00';
assert.strictEqual(isWithinAvailabilityText(malformedAvailability, range), true);

const area = JSON.stringify({
  v: 1,
  rows: [{ pref: '北海道', city: '札幌市', ward: '中央区' }],
});
assert.strictEqual(isWithinServiceAreaText(area, '札幌市中央区南1条'), true);
assert.strictEqual(isWithinServiceAreaText(area, '江別市野幌町'), false);
assert.strictEqual(isWithinServiceAreaText(area, '中央区南1条'), true);
assert.strictEqual(isWithinServiceAreaText('札幌市周辺', '江別市野幌町'), true);

async function testAvailableWorkersFiltering() {
  const originals = {
    bookingFindUnique: prisma.booking.findUnique,
    bookingFindMany: prisma.booking.findMany,
    userFindMany: prisma.user.findMany,
    slotFindMany: prisma.workerUnavailableSlot.findMany,
  };

  try {
    prisma.booking.findUnique = async () => ({
      id: 'booking-1',
      customerId: 'customer-1',
      workerId: null,
      serviceType: '掃除',
      scheduledDate: mon1000Jst,
      startTime: '10:00',
      duration: 2,
      address: '札幌市中央区南1条',
      status: 'PENDING',
      customer: { id: 'customer-1', name: '顧客' },
      worker: null,
      review: null,
      payment: null,
    });

    prisma.user.findMany = async () => [
      { id: 'available', name: '対応可', hourlyRate: 2000, rating: 5, reviewCount: 10, approvalStatus: 'APPROVED' },
      { id: 'busy', name: '予約重複', hourlyRate: 2000, rating: 5, reviewCount: 10, approvalStatus: 'APPROVED' },
      { id: 'blocked', name: '利用不可', hourlyRate: 2000, rating: 5, reviewCount: 10, approvalStatus: 'APPROVED' },
      {
        id: 'offday',
        name: '曜日不可',
        hourlyRate: 2000,
        rating: 5,
        reviewCount: 10,
        approvalStatus: 'APPROVED',
        availabilityText: JSON.stringify({ v: 1, days: [{ key: 'mon', closed: true }] }),
      },
      {
        id: 'outarea',
        name: 'エリア外',
        hourlyRate: 2000,
        rating: 5,
        reviewCount: 10,
        approvalStatus: 'APPROVED',
        serviceAreaText: JSON.stringify({ v: 1, rows: [{ pref: '北海道', city: '江別市', ward: '' }] }),
      },
    ];

    prisma.booking.findMany = async () => [
      {
        id: 'booking-2',
        workerId: 'busy',
        scheduledDate: '2026-06-15T01:30:00.000Z',
        startTime: '10:30',
        duration: 2,
        status: 'CONFIRMED',
      },
    ];

    prisma.workerUnavailableSlot.findMany = async () => [
      { workerId: 'blocked', localDate: '2026-06-15', slotIndex: 20 },
    ];

    const result = await bookingService.getAvailableWorkersForBooking(
      'booking-1',
      'customer-1',
      'CUSTOMER'
    );
    assert.deepStrictEqual(result.workers.map((worker) => worker.id), ['available']);
  } finally {
    prisma.booking.findUnique = originals.bookingFindUnique;
    prisma.booking.findMany = originals.bookingFindMany;
    prisma.user.findMany = originals.userFindMany;
    prisma.workerUnavailableSlot.findMany = originals.slotFindMany;
  }
}

testAvailableWorkersFiltering()
  .then(() => {
    console.log('Booking availability helper tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
