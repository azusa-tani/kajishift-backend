/**
 * 決済管理サービス
 */

const prisma = require('../config/database');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const stripeService = require('./stripeService');
const logger = require('../config/logger');
const opsAutoPauseService = require('./opsAutoPauseService');
const alertService = require('./alertService');

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

  try {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionId: intent.id,
        stripeStatus: intent.status || 'requires_payment_method',
        lastSyncedAt: new Date()
      }
    });
  } catch (error) {
    await opsAutoPauseService.recordOpsEvent({
      type: 'stripe_payment_update_failure',
      severity: 'critical',
      source: 'payment_intent_create',
      fingerprint: `stripe_payment_update_failure:${payment.id}`,
      paymentId: payment.id,
      message: `Stripe PaymentIntent作成後のDB更新に失敗しました: ${error.message}`,
      metadata: {
        bookingId,
        paymentIntentId: intent.id
      }
    }).catch(async (eventError) => {
      logger.error('Failed to record PaymentIntent DB update failure', {
        error: eventError.message,
        originalError: error.message,
        paymentIntentId: intent.id
      });
      await alertService.sendOpsAlert({
        title: 'KAJISHIFT payment DB update failed after Stripe intent',
        severity: 'critical',
        message: 'Stripe PaymentIntent作成後にDB Payment更新が失敗しました。決済受付を手動停止し、Stripe DashboardとDB Paymentを照合してください。',
        currentMode: 'unknown',
        reason: error.message,
        impact: 'Stripe側にPaymentIntentが存在し、DB側にtransactionIdが反映されていない可能性があります。',
        recoveryHints: [
          'Stripe DashboardでPaymentIntentを確認してください。',
          '該当 bookingId/paymentId のDB Paymentを確認してください。',
          'BETA_OPERATION_MODE_OVERRIDE=payment_paused または管理APIで決済受付を停止してください。'
        ],
        details: { bookingId, paymentId: payment.id, paymentIntentId: intent.id, recordError: eventError.message }
      });
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker().catch(() => {});
    throw error;
  }

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
    logger.warn('Stripe payment succeeded but Payment was not found', {
      paymentIntentId: paymentIntent.id,
      eventType: 'payment_intent.succeeded'
    });
    await opsAutoPauseService.recordOpsEvent({
      type: 'stripe_payment_not_found',
      severity: 'critical',
      source: 'stripe_webhook',
      fingerprint: `stripe_payment_not_found:${paymentIntent.id}`,
      message: 'Stripe成功イベントに対応するPaymentがDBで見つかりません。',
      metadata: {
        paymentIntentId: paymentIntent.id,
        metadata: paymentIntent.metadata || {}
      }
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker();
    return null;
  }

  if (paymentIntent.amount !== existingPayment.amount) {
    await opsAutoPauseService.recordOpsEvent({
      type: 'payment_amount_mismatch',
      severity: 'critical',
      source: 'stripe_webhook',
      fingerprint: `payment_amount_mismatch:${existingPayment.id}`,
      paymentId: existingPayment.id,
      message: 'Stripe成功イベントの金額とDB Payment金額が一致しません。',
      metadata: {
        paymentIntentId: paymentIntent.id,
        paymentAmount: existingPayment.amount,
        stripeAmount: paymentIntent.amount
      }
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker();
    return existingPayment;
  }

  if (existingPayment.status === 'COMPLETED') {
    return existingPayment;
  }

  const payment = await prisma.payment.update({
    where: { id: existingPayment.id },
    data: {
      status: 'COMPLETED',
      paymentMethod: 'stripe',
      stripeStatus: paymentIntent.status || 'succeeded',
      lastSyncedAt: new Date()
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
    logger.warn('Stripe payment failed but Payment was not found', {
      paymentIntentId: paymentIntent.id,
      eventType: 'payment_intent.payment_failed'
    });
    await opsAutoPauseService.recordOpsEvent({
      type: 'stripe_payment_not_found',
      severity: 'critical',
      source: 'stripe_webhook',
      fingerprint: `stripe_payment_not_found:${paymentIntent.id}`,
      message: 'Stripe失敗イベントに対応するPaymentがDBで見つかりません。',
      metadata: {
        paymentIntentId: paymentIntent.id,
        metadata: paymentIntent.metadata || {}
      }
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker();
    return null;
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      stripeStatus: paymentIntent.status || 'failed',
      lastSyncedAt: new Date()
    }
  });
};

const handleStripeEvent = async (event) => {
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { id: event.id }
  });

  if (existingEvent) {
    logger.info('Stripe webhook duplicate ignored', {
      eventId: event.id,
      type: event.type
    });
    return { received: true, duplicate: true };
  }

  await prisma.stripeEvent.create({
    data: {
      id: event.id,
      type: event.type,
      payload: {
        paymentIntentId: event.data && event.data.object ? event.data.object.id : null
      }
    }
  });

  try {
    let paymentResult = null;
    if (event.type === 'payment_intent.succeeded') {
      paymentResult = await markPaymentCompletedByIntent(event.data.object);
    } else if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
      paymentResult = await markPaymentFailedByIntent(event.data.object);
    }

    logger.info('Stripe webhook processed', {
      eventId: event.id,
      type: event.type,
      paymentIntentId: event.data && event.data.object ? event.data.object.id : null,
      paymentId: paymentResult ? paymentResult.id : null,
      paymentStatus: paymentResult ? paymentResult.status : null
    });

    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: {
        paymentId: paymentResult ? paymentResult.id : null,
        status: 'processed'
      }
    });
  } catch (error) {
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: {
        status: 'failed',
        errorMessage: error.message
      }
    }).catch(() => {});
    await opsAutoPauseService.recordOpsEvent({
      type: 'stripe_payment_update_failure',
      severity: 'critical',
      source: 'stripe_webhook',
      stripeEventId: event.id,
      fingerprint: `stripe_payment_update_failure:${event.id}`,
      message: `Stripe WebhookのDB反映に失敗しました: ${error.message}`,
      metadata: {
        eventType: event.type,
        paymentIntentId: event.data && event.data.object ? event.data.object.id : null
      }
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker();
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
