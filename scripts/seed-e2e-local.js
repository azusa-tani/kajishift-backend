/**
 * Non-destructive local seed for authenticated E2E checks.
 *
 * This script only upserts E2E-owned records. It must not delete or reset
 * existing local data.
 */

require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD = 'KajiShiftE2E!2026';
const SERVICE_TYPE = '掃除';
const ADDRESS = '札幌市中央区南1条西1丁目1-1';
const START_TIME = '10:00';
const DURATION = 2;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const accounts = {
  customer: {
    email: 'e2e-customer@example.com',
    name: 'E2E 依頼者',
    role: 'CUSTOMER',
  },
  availableWorker: {
    email: 'e2e-worker-available@example.com',
    name: 'E2E 対応可能ワーカー',
    role: 'WORKER',
  },
  busyWorker: {
    email: 'e2e-worker-busy@example.com',
    name: 'E2E 予約重複ワーカー',
    role: 'WORKER',
  },
  admin: {
    email: 'e2e-admin@example.com',
    name: 'E2E 管理者',
    role: 'ADMIN',
  },
};

function uuidFromName(name) {
  const hex = crypto.createHash('sha1').update(name).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymdFromUtcMsAsJst(ms) {
  const d = new Date(ms + JST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function jstDateAtUtcMs(ymd, hour, minute = 0) {
  const [year, month, day] = ymd.split('-').map(Number);
  return Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0);
}

function dayKeyFromYmd(ymd) {
  const [year, month, day] = ymd.split('-').map(Number);
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function isWeekday(ymd) {
  const dayKey = dayKeyFromYmd(ymd);
  return dayKey !== 'sun' && dayKey !== 'sat';
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function makeAvailabilityText() {
  return JSON.stringify({
    v: 1,
    days: [
      { key: 'mon', closed: false, start: '09:00', end: '18:00' },
      { key: 'tue', closed: false, start: '09:00', end: '18:00' },
      { key: 'wed', closed: false, start: '09:00', end: '18:00' },
      { key: 'thu', closed: false, start: '09:00', end: '18:00' },
      { key: 'fri', closed: false, start: '09:00', end: '18:00' },
      { key: 'sat', closed: true, start: '09:00', end: '18:00' },
      { key: 'sun', closed: true, start: '09:00', end: '18:00' },
    ],
  });
}

function makeServiceAreaText() {
  return JSON.stringify({
    v: 1,
    rows: [{ pref: '北海道', city: '札幌市', ward: '中央区' }],
  });
}

async function upsertUser({ email, name, role }, passwordHash, extra = {}) {
  const data = {
    email,
    password: passwordHash,
    name,
    phone: extra.phone || '090-9000-0000',
    role,
    status: 'ACTIVE',
    ...extra,
  };

  return prisma.user.upsert({
    where: { email },
    update: data,
    create: data,
  });
}

async function findTargetSlot(availableWorkerId) {
  const todayJst = ymdFromUtcMsAsJst(Date.now());
  const candidates = [];

  for (let offset = 2; offset <= 60; offset += 1) {
    const ymd = ymdFromUtcMsAsJst(jstDateAtUtcMs(todayJst, 0) + offset * DAY_MS);
    if (!isWeekday(ymd)) continue;
    candidates.push(ymd);
  }

  const candidateStartMs = candidates.map((ymd) => jstDateAtUtcMs(ymd, 10));
  const earliest = Math.min(...candidateStartMs) - DAY_MS;
  const latest = Math.max(...candidateStartMs) + DAY_MS;
  const existing = await prisma.booking.findMany({
    where: {
      workerId: availableWorkerId,
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      scheduledDate: {
        gte: new Date(earliest),
        lte: new Date(latest),
      },
    },
    select: {
      scheduledDate: true,
      duration: true,
    },
  });

  const busyRanges = existing
    .map((booking) => {
      const startMs = new Date(booking.scheduledDate).getTime();
      return { startMs, endMs: startMs + Number(booking.duration || 0) * 60 * 60 * 1000 };
    })
    .filter((range) => Number.isFinite(range.startMs) && range.endMs > range.startMs);

  for (const ymd of candidates) {
    const startMs = jstDateAtUtcMs(ymd, 10);
    const endMs = startMs + DURATION * 60 * 60 * 1000;
    if (!busyRanges.some((range) => rangesOverlap(startMs, endMs, range.startMs, range.endMs))) {
      return { ymd, startMs, endMs };
    }
  }

  throw new Error('E2E予約に使える平日10:00の空き枠が見つかりませんでした');
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('このseedはローカルE2E専用です。productionでは実行しないでください。');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const availabilityText = makeAvailabilityText();
  const serviceAreaText = makeServiceAreaText();

  const customer = await upsertUser(accounts.customer, passwordHash, {
    phone: '090-9000-0001',
    address: ADDRESS,
  });

  const availableWorker = await upsertUser(accounts.availableWorker, passwordHash, {
    phone: '090-9000-0002',
    bio: 'E2E確認用の対応可能ワーカーです。',
    hourlyRate: 2400,
    rating: 4.9,
    reviewCount: 12,
    approvalStatus: 'APPROVED',
    serviceAreaText,
    availabilityText,
  });

  const busyWorker = await upsertUser(accounts.busyWorker, passwordHash, {
    phone: '090-9000-0003',
    bio: 'E2E確認用の予約重複ワーカーです。',
    hourlyRate: 2300,
    rating: 4.7,
    reviewCount: 8,
    approvalStatus: 'APPROVED',
    serviceAreaText,
    availabilityText,
  });

  const admin = await upsertUser(accounts.admin, passwordHash, {
    phone: '090-9000-0004',
  });

  const target = await findTargetSlot(availableWorker.id);
  const busyBookingId = uuidFromName(`kajishift:e2e:busy:${target.ymd}:${START_TIME}`);
  await prisma.booking.upsert({
    where: { id: busyBookingId },
    update: {
      customerId: customer.id,
      workerId: busyWorker.id,
      serviceType: SERVICE_TYPE,
      scheduledDate: new Date(target.startMs),
      startTime: START_TIME,
      duration: DURATION,
      address: ADDRESS,
      notes: `E2E_BUSY_BLOCKER ${target.ymd} ${START_TIME}`,
      status: 'CONFIRMED',
      totalAmount: busyWorker.hourlyRate * DURATION,
    },
    create: {
      id: busyBookingId,
      customerId: customer.id,
      workerId: busyWorker.id,
      serviceType: SERVICE_TYPE,
      scheduledDate: new Date(target.startMs),
      startTime: START_TIME,
      duration: DURATION,
      address: ADDRESS,
      notes: `E2E_BUSY_BLOCKER ${target.ymd} ${START_TIME}`,
      status: 'CONFIRMED',
      totalAmount: busyWorker.hourlyRate * DURATION,
    },
  });

  const summary = {
    password: PASSWORD,
    bookingInput: {
      date: target.ymd,
      startTime: START_TIME,
      duration: DURATION,
      service: SERVICE_TYPE,
      address: ADDRESS,
    },
    accounts: {
      customer: customer.email,
      availableWorker: availableWorker.email,
      busyWorker: busyWorker.email,
      admin: admin.email,
    },
    busyBookingId,
    note: 'This seed uses only upsert and does not delete existing data.',
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
