/**
 * 決済管理サービス
 */

const prisma = require('../config/database');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const stripeService = require('./stripeService');

const { serializeBooking, WORKER_PROFILE_FILES } = bookingService;

const createHttpError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * 決済履歴を取得
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 * @param {object} filters - フィルター（status, page, limit）
 */
const getPayments = async (userId, userRole, filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {};

  // ロールに応じてフィルター
  if (userRole === 'CUSTOMER') {
    where.userId = userId;
  } else if (userRole === 'ADMIN') {
    // 管理者はすべての決済を取得
  } else {
    throw new Error('決済履歴を取得できるのは顧客または管理者のみです');
  }

  // ステータスフィルター
  if (status) {
    where.status = status;
  }

  // 決済を取得
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
                hourlyRate: true,
                files: WORKER_PROFILE_FILES,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.payment.count({ where })
  ]);

  return {
    payments: payments.map((p) => ({
      ...p,
      booking: p.booking ? serializeBooking(p.booking) : p.booking,
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const includePaymentRelations = {
  booking: {
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          hourlyRate: true,
          files: WORKER_PROFILE_FILES,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
};

const calculateBookingAmount = (booking) => {
  let amount = booking.totalAmount || 0;
  if (!amount && booking.worker && booking.worker.hourlyRate) {
    amount = booking.worker.hourlyRate * booking.duration;
  }

  if (amount <= 0) {
    throw createHttpError('決済金額が0円以下です', 400);
  }

  return amount;
};

const assertPaymentAllowed = (booking) => {
  if (booking.status === 'PENDING') {
    throw createHttpError('ワーカー確定前の予約は決済できません', 409);
  }

  if (booking.status === 'COMPLETED') {
    throw createHttpError('完了済みの予約は新規決済できません', 409);
  }

  if (booking.status === 'CANCELLED') {
    throw createHttpError('キャンセル済みの予約は決済できません', 409);
  }
};

/**
 * Stripe PaymentIntentを作成
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID（支払い者）
 */
const createPaymentIntent = async (bookingId, userId) => {

  // 予約の存在確認と権限チェック
  const booking = await bookingService.getBookingById(bookingId, userId, 'CUSTOMER');

  // 顧客のみ決済可能
  if (booking.customerId !== userId) {
    throw createHttpError('この予約の決済を実行する権限がありません', 403);
  }

  // 既に決済が存在するかチェック
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId }
  });

  if (existingPayment) {
    if (existingPayment.status === 'COMPLETED') {
      throw createHttpError('この予約は既に決済済みです', 409);
    }
    if (existingPayment.status === 'PENDING' && existingPayment.transactionId) {
      throw createHttpError('この予約の決済は既に処理中です', 409);
    }
  }

  assertPaymentAllowed(booking);

  const amount = calculateBookingAmount(booking);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true }
  });
  const customerId = await stripeService.getOrCreateCustomer(user);

  let payment = existingPayment;
  if (existingPayment) {
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount,
        paymentMethod: 'stripe',
        transactionId: null,
        status: 'PENDING'
      }
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        paymentMethod: 'stripe',
        status: 'PENDING'
      }
    });
  }

  // 予約の合計金額を更新
  await prisma.booking.update({
    where: { id: bookingId },
    data: { totalAmount: amount }
  });

  const intent = await stripeService.createPaymentIntent({
    amount,
    customerId,
    bookingId,
    userId,
    paymentId: payment.id
  });

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: intent.id }
  });

  return {
    payment,
    clientSecret: intent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
  };
};

const notifyPaymentCompleted = async (payment) => {
  try {
    if (payment.booking.workerId) {
      await notificationService.createNotification(
        payment.booking.workerId,
        'PAYMENT',
        '決済が完了しました',
        `${payment.booking.customer.name}さんからの決済（${payment.amount.toLocaleString()}円）が完了しました。`,
        payment.id,
        'PAYMENT'
      );
    }
  } catch (error) {
    // 通知生成エラーは無視（決済処理は成功）
    console.error('通知生成エラー:', error);
  }

  // メール送信（顧客に決済完了通知）
  try {
    if (payment.user && payment.user.email) {
      await emailService.sendPaymentConfirmationEmail(
        payment.user.email,
        payment.user.name,
        {
          amount: payment.amount,
          bookingId: payment.bookingId,
          serviceType: payment.booking.serviceType,
          paymentDate: payment.createdAt
        }
      );
    }
  } catch (error) {
    // メール送信エラーは無視（決済処理は成功）
    console.error('メール送信エラー:', error);
  }
};

const markPaymentCompletedByIntent = async (paymentIntent) => {
  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId: paymentIntent.id }
  });

  if (!existingPayment) {
    return null;
  }

  const payment = await prisma.payment.update({
    where: { id: existingPayment.id },
    data: {
      status: 'COMPLETED',
      paymentMethod: 'stripe'
    },
    include: includePaymentRelations
  });

  await notifyPaymentCompleted(payment);

  return {
    ...payment,
    booking: payment.booking ? serializeBooking(payment.booking) : payment.booking,
  };
};

const markPaymentFailedByIntent = async (paymentIntent) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: paymentIntent.id }
  });

  if (!payment) {
    return null;
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED' }
  });
};

const handleStripeEvent = async (event) => {
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { id: event.id }
  });

  if (existingEvent) {
    return { received: true, duplicate: true };
  }

  await prisma.stripeEvent.create({
    data: {
      id: event.id,
      type: event.type
    }
  });

  try {
    if (event.type === 'payment_intent.succeeded') {
      await markPaymentCompletedByIntent(event.data.object);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      await markPaymentFailedByIntent(event.data.object);
    }
  } catch (error) {
    await prisma.stripeEvent.delete({
      where: { id: event.id }
    }).catch(() => {});
    throw error;
  }

  return { received: true };
};

const processPayment = async () => {
  const error = new Error('旧決済APIは廃止されました。POST /api/payments/intent を使用してください。');
  error.status = 410;
  throw error;
};

module.exports = {
  getPayments,
  createPaymentIntent,
  handleStripeEvent,
  processPayment
};
