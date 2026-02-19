/**
 * 決済管理サービス
 */

const prisma = require('../config/database');
const bookingService = require('./bookingService');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

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
                email: true
              }
            }
          }
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
    payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * 決済を処理
 * @param {string} bookingId - 予約ID
 * @param {string} userId - ユーザーID（支払い者）
 * @param {string} paymentMethod - 決済方法
 * @param {string} transactionId - 外部決済システムのトランザクションID（オプション）
 */
const processPayment = async (bookingId, userId, paymentMethod, transactionId = null) => {
  // 必須フィールドのチェック
  if (!paymentMethod) {
    throw new Error('決済方法は必須です');
  }

  const validPaymentMethods = ['credit_card', 'bank_transfer', 'cash'];
  if (!validPaymentMethods.includes(paymentMethod)) {
    throw new Error('無効な決済方法です');
  }

  // 予約の存在確認と権限チェック
  const booking = await bookingService.getBookingById(bookingId, userId, 'CUSTOMER');

  // 顧客のみ決済可能
  if (booking.customerId !== userId) {
    throw new Error('この予約の決済を実行する権限がありません');
  }

  // 既に決済が存在するかチェック
  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId }
  });

  if (existingPayment) {
    if (existingPayment.status === 'COMPLETED') {
      throw new Error('この予約は既に決済済みです');
    }
    if (existingPayment.status === 'PENDING') {
      throw new Error('この予約の決済は既に処理中です');
    }
  }

  // 予約のステータスチェック
  if (booking.status === 'CANCELLED') {
    throw new Error('キャンセル済みの予約は決済できません');
  }

  // 予約金額を計算（ワーカーが選択されている場合）
  let amount = booking.totalAmount || 0;
  if (!amount && booking.worker && booking.worker.hourlyRate) {
    amount = booking.worker.hourlyRate * booking.duration;
  }

  if (amount <= 0) {
    throw new Error('決済金額が0円以下です');
  }

  // 決済を作成または更新
  let payment;
  if (existingPayment) {
    // 既存の決済を更新
    payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        paymentMethod,
        transactionId: transactionId || existingPayment.transactionId,
        status: 'COMPLETED'
      },
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
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  } else {
    // 新しい決済を作成
    payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        paymentMethod,
        transactionId,
        status: 'COMPLETED'
      },
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
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  // 予約の合計金額を更新
  await prisma.booking.update({
    where: { id: bookingId },
    data: { totalAmount: amount }
  });

  // 通知を生成（ワーカーに通知）
  try {
    if (payment.booking.workerId) {
      await notificationService.createNotification(
        payment.booking.workerId,
        'PAYMENT',
        '決済が完了しました',
        `${payment.booking.customer.name}さんからの決済（${amount.toLocaleString()}円）が完了しました。`,
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

  return payment;
};

module.exports = {
  getPayments,
  processPayment
};
