/**
 * レビュー管理サービス
 */

const prisma = require('../config/database');
const notificationService = require('./notificationService');
const emailService = require('./emailService');

/**
 * レビューを投稿
 * @param {string} reviewerId - レビュー投稿者ID（依頼者）
 * @param {object} reviewData - レビューデータ
 */
const createReview = async (reviewerId, reviewData) => {
  const { bookingId, rating, comment } = reviewData;

  // 必須フィールドのチェック
  if (!bookingId || !rating) {
    throw new Error('予約IDと評価は必須です');
  }

  // 評価のバリデーション（1-5の範囲）
  if (rating < 1 || rating > 5) {
    throw new Error('評価は1から5の範囲で入力してください');
  }

  // 予約の存在確認と権限チェック
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: {
        select: { id: true, role: true }
      },
      worker: {
        select: { id: true }
      },
      review: true
    }
  });

  if (!booking) {
    throw new Error('予約が見つかりません');
  }

  // 依頼者のみレビューを投稿可能
  if (booking.customerId !== reviewerId) {
    throw new Error('この予約のレビューを投稿する権限がありません');
  }

  // 予約が完了している必要がある
  if (booking.status !== 'COMPLETED') {
    throw new Error('完了済みの予約のみレビューを投稿できます');
  }

  // 既にレビューが存在するかチェック
  if (booking.review) {
    throw new Error('この予約には既にレビューが投稿されています');
  }

  // ワーカーが設定されている必要がある
  if (!booking.workerId) {
    throw new Error('ワーカーが設定されていない予約にはレビューを投稿できません');
  }

  // トランザクションでレビュー作成とワーカーの評価更新を実行
  const result = await prisma.$transaction(async (tx) => {
    // レビューを作成
    const review = await tx.review.create({
      data: {
        bookingId,
        reviewerId,
        revieweeId: booking.workerId,
        rating,
        comment: comment || null
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        booking: {
          select: {
            id: true,
            serviceType: true,
            scheduledDate: true
          }
        }
      }
    });

    // ワーカーの評価を再計算
    const reviews = await tx.review.findMany({
      where: { revieweeId: booking.workerId },
      select: { rating: true }
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    const reviewCount = reviews.length;

    // ワーカーの評価とレビュー数を更新
    await tx.user.update({
      where: { id: booking.workerId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // 小数点第1位まで
        reviewCount
      }
    });

    return review;
  });

  // 通知を生成（ワーカーに通知）
  try {
    await notificationService.createNotification(
      booking.workerId,
      'REVIEW',
      '新しいレビューが投稿されました',
      `${result.reviewer.name}さんからレビューが投稿されました。評価: ${rating}${comment ? `\nコメント: ${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}` : ''}`,
      result.id,
      'REVIEW'
    );
  } catch (error) {
    // 通知生成エラーは無視（レビュー投稿は成功）
    console.error('通知生成エラー:', error);
  }

  // メール送信（ワーカーに通知）
  try {
    // ワーカーの情報を取得
    const worker = await prisma.user.findUnique({
      where: { id: booking.workerId },
      select: { id: true, name: true, email: true }
    });

    if (worker && worker.email) {
      await emailService.sendReviewNotificationEmail(
        worker.email,
        worker.name,
        {
          rating,
          comment,
          reviewerName: result.reviewer.name,
          serviceType: result.booking.serviceType
        }
      );
    }
  } catch (error) {
    // メール送信エラーは無視（レビュー投稿は成功）
    console.error('メール送信エラー:', error);
  }

  return result;
};

/**
 * ワーカーのレビュー一覧を取得（公開）
 * @param {string} workerId - ワーカーID
 * @param {object} filters - フィルター（page, limit）
 */
const getWorkerReviews = async (workerId, filters = {}) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // ワーカーの存在確認
  const worker = await prisma.user.findUnique({
    where: {
      id: workerId,
      role: 'WORKER'
    },
    select: { id: true }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  // レビューを取得
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { revieweeId: workerId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        booking: {
          select: {
            id: true,
            serviceType: true,
            scheduledDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.review.count({
      where: { revieweeId: workerId }
    })
  ]);

  return {
    reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

module.exports = {
  createReview,
  getWorkerReviews
};
