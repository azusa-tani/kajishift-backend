const assert = require('assert');

const notificationPath = require.resolve('../src/services/notificationService');
const socketPath = require.resolve('../src/config/socket');

const socketEvents = [];

require.cache[notificationPath] = {
  id: notificationPath,
  filename: notificationPath,
  loaded: true,
  exports: {
    createNotification: async () => ({}),
  },
};

require.cache[socketPath] = {
  id: socketPath,
  filename: socketPath,
  loaded: true,
  exports: {
    sendMessage: (userId, message) => {
      socketEvents.push({ userId, message });
    },
  },
};

const messageService = require('../src/services/messageService');
const prisma = require('../src/config/database');

const booking = {
  id: 'booking-1',
  customerId: 'customer-1',
  workerId: 'worker-1',
  serviceType: '掃除',
  scheduledDate: new Date('2030-01-01T01:00:00.000Z'),
  startTime: '10:00',
  duration: 2,
  address: '札幌市中央区',
  status: 'CONFIRMED',
  customer: {
    id: 'customer-1',
    name: '依頼者',
    email: 'customer@example.com',
    phone: null,
    address: '札幌市中央区',
  },
  worker: {
    id: 'worker-1',
    name: 'ワーカー',
    email: 'worker@example.com',
    phone: null,
    hourlyRate: 2500,
    rating: 4.8,
    bio: null,
    reviewCount: 10,
    files: [],
  },
  review: null,
  payment: null,
};

const messages = [];

const makeMessage = (data) => ({
  id: `message-${messages.length + 1}`,
  ...data,
  isRead: false,
  sender: data.senderId === 'customer-1'
    ? { id: 'customer-1', name: '依頼者', email: 'customer@example.com' }
    : { id: 'worker-1', name: 'ワーカー', email: 'worker@example.com' },
  receiver: data.receiverId === 'customer-1'
    ? { id: 'customer-1', name: '依頼者', email: 'customer@example.com' }
    : { id: 'worker-1', name: 'ワーカー', email: 'worker@example.com' },
  createdAt: new Date('2030-01-01T02:00:00.000Z'),
});

async function expectErrorStatus(promise, status) {
  await assert.rejects(promise, (error) => {
    assert.strictEqual(error.status, status);
    return true;
  });
}

async function run() {
  const originals = {
    bookingFindUnique: prisma.booking.findUnique,
    messageCreate: prisma.message.create,
    messageFindMany: prisma.message.findMany,
    messageCount: prisma.message.count,
  };

  try {
    prisma.booking.findUnique = async () => booking;
    prisma.message.create = async ({ data }) => {
      const message = makeMessage(data);
      messages.push(message);
      return message;
    };
    prisma.message.findMany = async () => messages;
    prisma.message.count = async () => messages.length;

    const text = await messageService.sendMessage('booking-1', 'customer-1', {
      content: 'こんにちは',
    });
    assert.strictEqual(text.content, 'こんにちは');
    assert.strictEqual(text.fileType, 'text');
    assert.strictEqual(text.imageUrl, undefined);

    const imageUrl = '/uploads/chat/sample.png';
    const image = await messageService.sendMessage('booking-1', 'worker-1', {
      content: imageUrl,
      fileType: 'image',
    });
    assert.strictEqual(image.content, imageUrl);
    assert.strictEqual(image.fileType, 'image');
    assert.strictEqual(image.imageUrl, imageUrl);

    const list = await messageService.getMessagesByBookingId('booking-1', 'customer-1', 'CUSTOMER');
    assert.strictEqual(list.messages.length, 2);
    assert.strictEqual(list.messages[0].content, 'こんにちは');
    assert.strictEqual(list.messages[0].fileType, 'text');
    assert.strictEqual(list.messages[1].content, imageUrl);
    assert.strictEqual(list.messages[1].fileType, 'image');
    assert.strictEqual(list.messages[1].imageUrl, imageUrl);

    assert.strictEqual(socketEvents.length, 2);
    assert.strictEqual(socketEvents[1].message.fileType, 'image');
    assert.strictEqual(socketEvents[1].message.imageUrl, imageUrl);

    await expectErrorStatus(
      messageService.sendMessage('booking-1', 'stranger-1', { content: '不正送信' }),
      403
    );

    await expectErrorStatus(
      messageService.sendMessage('booking-1', 'customer-1', {
        content: 'file',
        fileType: 'pdf',
      }),
      400
    );
  } finally {
    prisma.booking.findUnique = originals.bookingFindUnique;
    prisma.message.create = originals.messageCreate;
    prisma.message.findMany = originals.messageFindMany;
    prisma.message.count = originals.messageCount;
  }
}

run()
  .then(() => {
    console.log('Message attachment tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
