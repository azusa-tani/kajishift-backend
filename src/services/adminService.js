/**
 * 管理者サービス
 */

const prisma = require('../config/database');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const logger = require('../config/logger');
const socketService = require('../config/socket');

/**
 * ユーザー一覧を取得（管理者のみ）
 * @param {object} filters - フィルター（role, status, page, limit）
 */
const getUsers = async (filters = {}) => {
  const { role, status, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {};

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  // ユーザーを取得（パスワードは除外）
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        bio: true,
        hourlyRate: true,
        rating: true,
        reviewCount: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * ワーカー一覧を取得（管理者のみ）
 * @param {object} filters - フィルター（approvalStatus, status, page, limit）
 */
const getWorkers = async (filters = {}) => {
  const { approvalStatus, status, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {
    role: 'WORKER'
  };

  if (approvalStatus) {
    where.approvalStatus = approvalStatus;
  }

  if (status) {
    where.status = status;
  }

  // ワーカーを取得
  const [workers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        bio: true,
        hourlyRate: true,
        rating: true,
        reviewCount: true,
        approvalStatus: true,
        idDocumentUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  return {
    workers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * ワーカーを承認（管理者のみ）
 * @param {string} workerId - ワーカーID
 * @param {string} adminId - 管理者ID
 * @param {string} approvalStatus - 承認ステータス（APPROVED または REJECTED）
 */
const approveWorker = async (workerId, adminId, approvalStatus) => {
  // 承認ステータスのバリデーション
  if (approvalStatus !== 'APPROVED' && approvalStatus !== 'REJECTED') {
    throw new Error('承認ステータスは APPROVED または REJECTED である必要があります');
  }

  // ワーカーの存在確認
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      role: true,
      approvalStatus: true
    }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  if (worker.role !== 'WORKER') {
    throw new Error('指定されたユーザーはワーカーではありません');
  }

  // ワーカーの承認ステータスを更新
  const updatedWorker = await prisma.user.update({
    where: { id: workerId },
    data: {
      approvalStatus: approvalStatus
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      status: true,
      bio: true,
      hourlyRate: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // 通知を生成
  try {
    const notificationType = approvalStatus === 'APPROVED' ? 'WORKER_APPROVED' : 'WORKER_REJECTED';
    const title = approvalStatus === 'APPROVED' ? 'ワーカー承認が完了しました' : 'ワーカー承認が却下されました';
    const content = approvalStatus === 'APPROVED' 
      ? 'おめでとうございます！ワーカーとして承認されました。予約を受け付けることができます。'
      : '申し訳ございませんが、ワーカー承認が却下されました。詳細についてはサポートまでお問い合わせください。';

    await notificationService.createNotification(
      workerId,
      notificationType,
      title,
      content,
      null,
      'SYSTEM'
    );
  } catch (error) {
    // 通知生成エラーは無視（承認処理は成功）
    console.error('通知生成エラー:', error);
  }

  // メール送信（ワーカーに通知）
  try {
    if (updatedWorker.email) {
      await emailService.sendWorkerApprovalEmail(
        updatedWorker.email,
        updatedWorker.name,
        approvalStatus
      );
    }
  } catch (error) {
    // メール送信エラーは無視（承認処理は成功）
    console.error('メール送信エラー:', error);
  }

  return updatedWorker;
};

/**
 * 予約レポートを取得（管理者のみ）
 * @param {object} filters - フィルター（startDate, endDate）
 */
const getBookingReport = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // 日付範囲の条件を構築
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      // 終了日の23:59:59まで含める
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = end;
    }
  }

  // サマリー統計を取得
  const [total, pending, confirmed, inProgress, completed, cancelled] = await Promise.all([
    prisma.booking.count({ where: dateFilter }),
    prisma.booking.count({ where: { ...dateFilter, status: 'PENDING' } }),
    prisma.booking.count({ where: { ...dateFilter, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { ...dateFilter, status: 'IN_PROGRESS' } }),
    prisma.booking.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
    prisma.booking.count({ where: { ...dateFilter, status: 'CANCELLED' } })
  ]);

  // 日付別の集計（過去30日間、または指定範囲）
  const byDate = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  // 範囲内のすべての予約を一度に取得
  const bookingsInRange = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true
    }
  });

  // 日付別に集計
  const dateCountMap = {};
  bookingsInRange.forEach(booking => {
    const dateStr = booking.createdAt.toISOString().split('T')[0];
    dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
  });

  // すべての日付を生成（データがない日も0件として含める）
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    byDate.push({
      date: dateStr,
      count: dateCountMap[dateStr] || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // サービスタイプ別の集計
  const bookingsByServiceType = await prisma.booking.groupBy({
    by: ['serviceType'],
    where: dateFilter,
    _count: {
      serviceType: true
    }
  });

  const byServiceType = {};
  bookingsByServiceType.forEach(item => {
    byServiceType[item.serviceType] = item._count.serviceType;
  });

  return {
    summary: {
      total,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled
    },
    byDate,
    byServiceType
  };
};

/**
 * 売上レポートを取得（管理者のみ）
 * @param {object} filters - フィルター（startDate, endDate）
 */
const getRevenueReport = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // 日付範囲の条件を構築
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = end;
    }
  }

  // 完了した決済のみを対象
  const paymentDateFilter = {
    ...dateFilter,
    status: 'COMPLETED'
  };

  // サマリー統計を取得
  const completedPayments = await prisma.payment.findMany({
    where: paymentDateFilter,
    select: {
      amount: true
    }
  });

  const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalBookings = completedPayments.length;
  const averageRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  // 日付別の売上（過去30日間、または指定範囲）
  const byDate = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  // 範囲内のすべての完了済み決済を一度に取得
  const paymentsInRange = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true,
      amount: true
    }
  });

  // 日付別に集計
  const dateRevenueMap = {};
  paymentsInRange.forEach(payment => {
    const dateStr = payment.createdAt.toISOString().split('T')[0];
    dateRevenueMap[dateStr] = (dateRevenueMap[dateStr] || 0) + payment.amount;
  });

  // すべての日付を生成（データがない日も0円として含める）
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    byDate.push({
      date: dateStr,
      revenue: dateRevenueMap[dateStr] || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 月別の売上（過去12ヶ月、または指定範囲）
  const byMonth = [];
  const monthStart = new Date(start);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  while (monthStart <= end) {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    if (monthEnd > end) {
      monthEnd.setTime(end.getTime());
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        amount: true
      }
    });

    const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

    byMonth.push({
      month: monthStr,
      revenue
    });

    monthStart.setMonth(monthStart.getMonth() + 1);
  }

  return {
    summary: {
      totalRevenue,
      totalBookings,
      averageRevenue,
      completedPayments: totalBookings
    },
    byDate,
    byMonth
  };
};

/**
 * ユーザー統計レポートを取得（管理者のみ）
 * @param {object} filters - フィルター（startDate, endDate）
 */
const getUserReport = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // 日付範囲の条件を構築
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = end;
    }
  }

  // サマリー統計を取得
  const [total, customers, workers, admins, active, inactive, suspended] = await Promise.all([
    prisma.user.count({ where: dateFilter }),
    prisma.user.count({ where: { ...dateFilter, role: 'CUSTOMER' } }),
    prisma.user.count({ where: { ...dateFilter, role: 'WORKER' } }),
    prisma.user.count({ where: { ...dateFilter, role: 'ADMIN' } }),
    prisma.user.count({ where: { ...dateFilter, status: 'ACTIVE' } }),
    prisma.user.count({ where: { ...dateFilter, status: 'INACTIVE' } }),
    prisma.user.count({ where: { ...dateFilter, status: 'SUSPENDED' } })
  ]);

  // 日付別の新規ユーザー数（過去30日間、または指定範囲）
  const byDate = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  // 範囲内のすべてのユーザーを一度に取得
  const usersInRange = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true
    }
  });

  // 日付別に集計
  const dateCountMap = {};
  usersInRange.forEach(user => {
    const dateStr = user.createdAt.toISOString().split('T')[0];
    dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
  });

  // すべての日付を生成（データがない日も0件として含める）
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    byDate.push({
      date: dateStr,
      count: dateCountMap[dateStr] || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // ロール別の集計
  const byRole = {
    CUSTOMER: customers,
    WORKER: workers,
    ADMIN: admins
  };

  // ステータス別の集計
  const byStatus = {
    ACTIVE: active,
    INACTIVE: inactive,
    SUSPENDED: suspended
  };

  return {
    summary: {
      total,
      customers,
      workers,
      admins,
      active,
      inactive,
      suspended
    },
    byDate,
    byRole,
    byStatus
  };
};

/**
 * ワーカー統計レポートを取得（管理者のみ）
 * @param {object} filters - フィルター（startDate, endDate）
 */
const getWorkerReport = async (filters = {}) => {
  const { startDate, endDate } = filters;

  // 日付範囲の条件を構築
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.lte = end;
    }
  }

  // ワーカーのみを対象
  const workerFilter = {
    ...dateFilter,
    role: 'WORKER'
  };

  // サマリー統計を取得
  const [total, pending, approved, rejected, active, inactive, suspended] = await Promise.all([
    prisma.user.count({ where: workerFilter }),
    prisma.user.count({ where: { ...workerFilter, approvalStatus: 'PENDING' } }),
    prisma.user.count({ where: { ...workerFilter, approvalStatus: 'APPROVED' } }),
    prisma.user.count({ where: { ...workerFilter, approvalStatus: 'REJECTED' } }),
    prisma.user.count({ where: { ...workerFilter, status: 'ACTIVE' } }),
    prisma.user.count({ where: { ...workerFilter, status: 'INACTIVE' } }),
    prisma.user.count({ where: { ...workerFilter, status: 'SUSPENDED' } })
  ]);

  // 平均評価と平均時給を計算
  const workers = await prisma.user.findMany({
    where: workerFilter,
    select: {
      rating: true,
      hourlyRate: true
    }
  });

  const validRatings = workers.filter(w => w.rating !== null && w.rating > 0);
  const validRates = workers.filter(w => w.hourlyRate !== null && w.hourlyRate > 0);

  const averageRating = validRatings.length > 0
    ? validRatings.reduce((sum, w) => sum + w.rating, 0) / validRatings.length
    : 0;

  const averageHourlyRate = validRates.length > 0
    ? Math.round(validRates.reduce((sum, w) => sum + w.hourlyRate, 0) / validRates.length)
    : 0;

  // 日付別の新規ワーカー数（過去30日間、または指定範囲）
  const byDate = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  // 範囲内のすべてのワーカーを一度に取得
  const workersInRange = await prisma.user.findMany({
    where: {
      role: 'WORKER',
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true
    }
  });

  // 日付別に集計
  const dateCountMap = {};
  workersInRange.forEach(worker => {
    const dateStr = worker.createdAt.toISOString().split('T')[0];
    dateCountMap[dateStr] = (dateCountMap[dateStr] || 0) + 1;
  });

  // すべての日付を生成（データがない日も0件として含める）
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    byDate.push({
      date: dateStr,
      count: dateCountMap[dateStr] || 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 承認ステータス別の集計
  const byApprovalStatus = {
    PENDING: pending,
    APPROVED: approved,
    REJECTED: rejected
  };

  // ステータス別の集計
  const byStatus = {
    ACTIVE: active,
    INACTIVE: inactive,
    SUSPENDED: suspended
  };

  return {
    summary: {
      total,
      pending,
      approved,
      rejected,
      active,
      inactive,
      suspended,
      averageRating: Math.round(averageRating * 10) / 10,
      averageHourlyRate
    },
    byDate,
    byApprovalStatus,
    byStatus
  };
};

/**
 * システム通知を作成・送信（管理者のみ）
 * @param {string} adminId - 管理者ID
 * @param {object} notificationData - 通知データ
 */
const createSystemNotification = async (adminId, notificationData) => {
  const { title, content, targetRole = null, targetUserIds = null, priority = 'normal', sendEmail = true } = notificationData;

  // 必須フィールドのチェック
  if (!title || !content) {
    throw new Error('タイトルと内容は必須です');
  }

  // 優先度のバリデーション
  const validPriorities = ['low', 'normal', 'high'];
  if (!validPriorities.includes(priority)) {
    throw new Error('優先度は low, normal, high のいずれかである必要があります');
  }

  // 送信対象ユーザーを取得
  let targetUsers = [];
  let searchCondition = '';
  
  if (targetUserIds && targetUserIds.length > 0) {
    // 特定のユーザーIDに送信
    searchCondition = `指定されたユーザーID (${targetUserIds.length}件)`;
    targetUsers = await prisma.user.findMany({
      where: {
        id: { in: targetUserIds },
        status: 'ACTIVE' // アクティブなユーザーのみ
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    
    // デバッグ情報: 指定されたIDのうち、アクティブでないユーザーを確認
    if (targetUsers.length < targetUserIds.length) {
      const inactiveUsers = await prisma.user.findMany({
        where: {
          id: { in: targetUserIds },
          status: { not: 'ACTIVE' }
        },
        select: {
          id: true,
          email: true,
          status: true
        }
      });
      
      if (inactiveUsers.length > 0) {
        logger.warn(`指定されたユーザーIDのうち、アクティブでないユーザー: ${inactiveUsers.length}件`, inactiveUsers);
      }
    }
  } else if (targetRole) {
    // 特定のロールに送信
    searchCondition = `ロール: ${targetRole}`;
    targetUsers = await prisma.user.findMany({
      where: {
        role: targetRole,
        status: 'ACTIVE' // アクティブなユーザーのみ
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    
    // デバッグ情報: 指定されたロールの全ユーザー数を確認
    const totalUsersInRole = await prisma.user.count({
      where: { role: targetRole }
    });
    const activeUsersInRole = await prisma.user.count({
      where: { role: targetRole, status: 'ACTIVE' }
    });
    
    if (totalUsersInRole > 0 && activeUsersInRole === 0) {
      logger.warn(`ロール ${targetRole} のユーザーは ${totalUsersInRole} 人いますが、すべてアクティブではありません`);
    }
  } else {
    // 全ユーザーに送信
    searchCondition = '全ユーザー';
    targetUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE' // アクティブなユーザーのみ
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      }
    });
    
    // デバッグ情報: 全ユーザー数を確認
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });
    
    if (totalUsers > 0 && activeUsers === 0) {
      logger.warn(`データベースには ${totalUsers} 人のユーザーがいますが、すべてアクティブではありません`);
    } else if (totalUsers === 0) {
      logger.warn('データベースにユーザーが存在しません');
    }
  }

  if (targetUsers.length === 0) {
    const errorMessage = `送信対象のユーザーが見つかりません（検索条件: ${searchCondition}）。データベースにアクティブなユーザーが存在するか確認してください。`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // 通知を作成（各ユーザーに通知レコードを作成）
  const notifications = [];
  const emailPromises = [];

  for (const user of targetUsers) {
    try {
      // 通知レコードを作成
      const notification = await notificationService.createNotification(
        user.id,
        'SYSTEM',
        title,
        content,
        null,
        'SYSTEM'
      );
      notifications.push(notification);

      // メール送信（オプション）
      if (sendEmail && user.email) {
        emailPromises.push(
          emailService.sendSystemNotificationEmail(
            user.email,
            user.name,
            { title, content, priority }
          ).catch(error => {
            // メール送信エラーはログに記録するが、通知作成は継続
            logger.error(`システム通知メール送信エラー (ユーザーID: ${user.id}):`, error);
            return null;
          })
        );
      }
    } catch (error) {
      // 通知作成エラーはログに記録するが、処理は継続
      logger.error(`システム通知作成エラー (ユーザーID: ${user.id}):`, error);
    }
  }

  // メール送信を並列実行（非同期で処理）
  if (emailPromises.length > 0) {
    Promise.all(emailPromises).then(results => {
      const successCount = results.filter(r => r !== null).length;
      logger.info(`システム通知メール送信完了: ${successCount}/${emailPromises.length}件成功`);
    }).catch(error => {
      logger.error('システム通知メール送信エラー:', error);
    });
  }

  // リアルタイム通知を送信（非同期で処理）
  try {
    notifications.forEach(notification => {
      const user = targetUsers.find(u => u.id === notification.userId);
      if (user) {
        socketService.sendNotificationToUser(user.id, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          isRead: notification.isRead,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType,
          createdAt: notification.createdAt
        });
      }
    });
  } catch (error) {
    logger.error('リアルタイム通知送信エラー:', error);
  }

  return {
    message: 'システム通知を作成しました',
    sentCount: notifications.length,
    totalUsers: targetUsers.length,
    notifications: notifications.slice(0, 10) // 最初の10件のみ返す（パフォーマンスのため）
  };
};

/**
 * グラフ用データを取得（チャート表示用、管理者のみ）
 * @param {string} reportType - レポートタイプ（bookings, revenue, users, workers）
 * @param {object} filters - フィルター（startDate, endDate, groupBy）
 */
const getChartData = async (reportType, filters = {}) => {
  const { startDate, endDate, groupBy = 'day' } = filters;

  // 日付範囲の設定
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  let chartData = [];

  switch (reportType) {
    case 'bookings':
      chartData = await getBookingChartData(start, end, groupBy);
      break;
    case 'revenue':
      chartData = await getRevenueChartData(start, end, groupBy);
      break;
    case 'users':
      chartData = await getUserChartData(start, end, groupBy);
      break;
    case 'workers':
      chartData = await getWorkerChartData(start, end, groupBy);
      break;
    default:
      throw new Error('無効なレポートタイプです');
  }

  return {
    reportType,
    groupBy,
    period: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    data: chartData
  };
};

/**
 * 予約レポートのグラフ用データを取得
 */
const getBookingChartData = async (start, end, groupBy) => {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true,
      status: true
    }
  });

  const dataMap = {};
  bookings.forEach(booking => {
    const key = formatDateKey(booking.createdAt, groupBy);
    if (!dataMap[key]) {
      dataMap[key] = { date: key, total: 0, confirmed: 0, cancelled: 0, completed: 0 };
    }
    dataMap[key].total++;
    if (booking.status === 'CONFIRMED') dataMap[key].confirmed++;
    if (booking.status === 'CANCELLED') dataMap[key].cancelled++;
    if (booking.status === 'COMPLETED') dataMap[key].completed++;
  });

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 売上レポートのグラフ用データを取得
 */
const getRevenueChartData = async (start, end, groupBy) => {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true,
      amount: true
    }
  });

  const dataMap = {};
  payments.forEach(payment => {
    const key = formatDateKey(payment.createdAt, groupBy);
    if (!dataMap[key]) {
      dataMap[key] = { date: key, revenue: 0, count: 0 };
    }
    dataMap[key].revenue += payment.amount;
    dataMap[key].count++;
  });

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * ユーザーレポートのグラフ用データを取得
 */
const getUserChartData = async (start, end, groupBy) => {
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true,
      role: true,
      status: true
    }
  });

  const dataMap = {};
  users.forEach(user => {
    const key = formatDateKey(user.createdAt, groupBy);
    if (!dataMap[key]) {
      dataMap[key] = { date: key, total: 0, customers: 0, workers: 0, admins: 0 };
    }
    dataMap[key].total++;
    if (user.role === 'CUSTOMER') dataMap[key].customers++;
    if (user.role === 'WORKER') dataMap[key].workers++;
    if (user.role === 'ADMIN') dataMap[key].admins++;
  });

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * ワーカーレポートのグラフ用データを取得
 */
const getWorkerChartData = async (start, end, groupBy) => {
  const workers = await prisma.user.findMany({
    where: {
      role: 'WORKER',
      createdAt: {
        gte: start,
        lte: end
      }
    },
    select: {
      createdAt: true,
      approvalStatus: true,
      status: true
    }
  });

  const dataMap = {};
  workers.forEach(worker => {
    const key = formatDateKey(worker.createdAt, groupBy);
    if (!dataMap[key]) {
      dataMap[key] = { date: key, total: 0, approved: 0, pending: 0, rejected: 0 };
    }
    dataMap[key].total++;
    if (worker.approvalStatus === 'APPROVED') dataMap[key].approved++;
    if (worker.approvalStatus === 'PENDING') dataMap[key].pending++;
    if (worker.approvalStatus === 'REJECTED') dataMap[key].rejected++;
  });

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 日付キーをフォーマット（groupByに応じて）
 */
const formatDateKey = (date, groupBy) => {
  const d = new Date(date);
  switch (groupBy) {
    case 'hour':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
    case 'day':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    case 'week':
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 6 - weekStart.getDay()) / 7)).padStart(2, '0')}`;
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return `${d.getFullYear()}`;
    default:
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};

/**
 * 比較レポートを取得（前月比、前年比、管理者のみ）
 * @param {string} reportType - レポートタイプ（bookings, revenue, users, workers）
 * @param {object} filters - フィルター（startDate, endDate, compareType）
 */
const getComparisonReport = async (reportType, filters = {}) => {
  const { startDate, endDate, compareType = 'month' } = filters;

  // 現在期間の設定
  const currentStart = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const currentEnd = endDate ? new Date(endDate) : new Date();
  currentEnd.setHours(23, 59, 59, 999);

  // 比較期間の設定
  let compareStart, compareEnd;
  const periodDays = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24));

  if (compareType === 'month') {
    // 前月同期間
    compareStart = new Date(currentStart);
    compareStart.setMonth(compareStart.getMonth() - 1);
    compareEnd = new Date(currentEnd);
    compareEnd.setMonth(compareEnd.getMonth() - 1);
  } else if (compareType === 'year') {
    // 前年同期間
    compareStart = new Date(currentStart);
    compareStart.setFullYear(compareStart.getFullYear() - 1);
    compareEnd = new Date(currentEnd);
    compareEnd.setFullYear(compareEnd.getFullYear() - 1);
  } else {
    // 前期間（同じ日数分前）
    compareEnd = new Date(currentStart);
    compareEnd.setTime(compareEnd.getTime() - 1);
    compareStart = new Date(compareEnd);
    compareStart.setTime(compareStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
  }

  // 現在期間と比較期間のデータを取得
  const [currentData, compareData] = await Promise.all([
    getReportDataForPeriod(reportType, currentStart, currentEnd),
    getReportDataForPeriod(reportType, compareStart, compareEnd)
  ]);

  // 比較計算
  const comparison = calculateComparison(currentData, compareData);

  return {
    reportType,
    compareType,
    currentPeriod: {
      start: currentStart.toISOString(),
      end: currentEnd.toISOString(),
      data: currentData
    },
    comparePeriod: {
      start: compareStart.toISOString(),
      end: compareEnd.toISOString(),
      data: compareData
    },
    comparison
  };
};

/**
 * 指定期間のレポートデータを取得
 */
const getReportDataForPeriod = async (reportType, start, end) => {
  switch (reportType) {
    case 'bookings':
      const bookings = await prisma.booking.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      });
      return { count: bookings };
    case 'revenue':
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        select: { amount: true }
      });
      const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
      return { revenue, count: payments.length };
    case 'users':
      const users = await prisma.user.count({
        where: {
          createdAt: { gte: start, lte: end }
        }
      });
      return { count: users };
    case 'workers':
      const workers = await prisma.user.count({
        where: {
          role: 'WORKER',
          createdAt: { gte: start, lte: end }
        }
      });
      return { count: workers };
    default:
      throw new Error('無効なレポートタイプです');
  }
};

/**
 * 比較計算を行う
 */
const calculateComparison = (current, compare) => {
  const comparison = {};

  if (current.count !== undefined && compare.count !== undefined) {
    const diff = current.count - compare.count;
    const percentChange = compare.count > 0 ? ((diff / compare.count) * 100).toFixed(2) : (current.count > 0 ? 100 : 0);
    comparison.count = {
      current: current.count,
      compare: compare.count,
      diff,
      percentChange: parseFloat(percentChange)
    };
  }

  if (current.revenue !== undefined && compare.revenue !== undefined) {
    const diff = current.revenue - compare.revenue;
    const percentChange = compare.revenue > 0 ? ((diff / compare.revenue) * 100).toFixed(2) : (current.revenue > 0 ? 100 : 0);
    comparison.revenue = {
      current: current.revenue,
      compare: compare.revenue,
      diff,
      percentChange: parseFloat(percentChange)
    };
  }

  return comparison;
};

/**
 * カスタムレポートを取得（複数条件の組み合わせ、管理者のみ）
 * @param {object} filters - フィルター（reportTypes, startDate, endDate, groupBy, metrics）
 */
const getCustomReport = async (filters = {}) => {
  const { reportTypes, startDate, endDate, groupBy = 'day', metrics = [] } = filters;

  if (!reportTypes || !Array.isArray(reportTypes) || reportTypes.length === 0) {
    throw new Error('レポートタイプは必須です');
  }

  // 日付範囲の設定
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  // 各レポートタイプのデータを取得
  const reportData = {};
  for (const reportType of reportTypes) {
    if (['bookings', 'revenue', 'users', 'workers'].includes(reportType)) {
      const chartData = await getChartData(reportType, { startDate, endDate, groupBy });
      reportData[reportType] = chartData.data;
    }
  }

  // メトリクス計算（指定された場合）
  const calculatedMetrics = {};
  if (metrics.length > 0) {
    for (const metric of metrics) {
      calculatedMetrics[metric] = await calculateMetric(metric, start, end);
    }
  }

  return {
    reportTypes,
    period: {
      start: start.toISOString(),
      end: end.toISOString()
    },
    groupBy,
    data: reportData,
    metrics: calculatedMetrics
  };
};

/**
 * メトリクスを計算
 */
const calculateMetric = async (metric, start, end) => {
  switch (metric) {
    case 'averageBookingValue':
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        },
        select: { amount: true }
      });
      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      return payments.length > 0 ? total / payments.length : 0;
    case 'conversionRate':
      const totalBookings = await prisma.booking.count({
        where: { createdAt: { gte: start, lte: end } }
      });
      const completedBookings = await prisma.booking.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end }
        }
      });
      return totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    case 'activeWorkers':
      return await prisma.user.count({
        where: {
          role: 'WORKER',
          status: 'ACTIVE',
          approvalStatus: 'APPROVED'
        }
      });
    default:
      return null;
  }
};

/**
 * ユーザー情報を更新（管理者のみ）
 * @param {string} userId - ユーザーID
 * @param {object} updateData - 更新データ（name, email, phone, status, address等）
 */
const updateUser = async (userId, updateData) => {
  // ユーザーの存在確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  // 更新可能なフィールドを構築
  const data = {};

  if (updateData.name !== undefined) {
    if (!updateData.name || updateData.name.trim().length === 0) {
      throw new Error('名前は必須です');
    }
    data.name = updateData.name.trim();
  }

  if (updateData.email !== undefined) {
    if (!updateData.email || !updateData.email.includes('@')) {
      throw new Error('有効なメールアドレスを入力してください');
    }
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: updateData.email }
    });
    if (existingUser && existingUser.id !== userId) {
      throw new Error('このメールアドレスは既に使用されています');
    }
    data.email = updateData.email.trim();
  }

  if (updateData.phone !== undefined) {
    data.phone = updateData.phone ? updateData.phone.trim() : null;
  }

  if (updateData.status !== undefined) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error('無効なステータスです');
    }
    data.status = updateData.status;
  }

  if (updateData.address !== undefined) {
    data.address = updateData.address ? updateData.address.trim() : null;
  }

  // ユーザーを更新
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      address: true,
      bio: true,
      hourlyRate: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedUser;
};

/**
 * ユーザーを削除（管理者のみ）
 * @param {string} userId - ユーザーID
 */
const deleteUser = async (userId) => {
  // ユーザーの存在確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  // 管理者は削除できない（セキュリティのため）
  if (user.role === 'ADMIN') {
    throw new Error('管理者アカウントは削除できません');
  }

  // 関連データの確認（予約、決済などがある場合は削除できない可能性がある）
  const [bookingsCount, paymentsCount] = await Promise.all([
    prisma.booking.count({
      where: {
        OR: [
          { customerId: userId },
          { workerId: userId }
        ]
      }
    }),
    prisma.payment.count({
      where: { userId: userId }
    })
  ]);

  // ユーザーを削除（Cascade削除で関連データも削除される）
  await prisma.user.delete({
    where: { id: userId }
  });

  return {
    message: 'ユーザーを削除しました',
    deletedUser: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    relatedData: {
      bookings: bookingsCount,
      payments: paymentsCount
    }
  };
};

/**
 * ワーカー情報を更新（管理者のみ）
 * @param {string} workerId - ワーカーID
 * @param {object} updateData - 更新データ（name, email, phone, status, bio, hourlyRate等）
 */
const updateWorker = async (workerId, updateData) => {
  // ワーカーの存在確認
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { id: true, role: true }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  if (worker.role !== 'WORKER') {
    throw new Error('指定されたユーザーはワーカーではありません');
  }

  // 更新可能なフィールドを構築
  const data = {};

  if (updateData.name !== undefined) {
    if (!updateData.name || updateData.name.trim().length === 0) {
      throw new Error('名前は必須です');
    }
    data.name = updateData.name.trim();
  }

  if (updateData.email !== undefined) {
    if (!updateData.email || !updateData.email.includes('@')) {
      throw new Error('有効なメールアドレスを入力してください');
    }
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: updateData.email }
    });
    if (existingUser && existingUser.id !== workerId) {
      throw new Error('このメールアドレスは既に使用されています');
    }
    data.email = updateData.email.trim();
  }

  if (updateData.phone !== undefined) {
    data.phone = updateData.phone ? updateData.phone.trim() : null;
  }

  if (updateData.status !== undefined) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error('無効なステータスです');
    }
    data.status = updateData.status;
  }

  if (updateData.bio !== undefined) {
    data.bio = updateData.bio ? updateData.bio.trim() : null;
  }

  if (updateData.hourlyRate !== undefined) {
    if (updateData.hourlyRate !== null && (isNaN(updateData.hourlyRate) || updateData.hourlyRate < 0)) {
      throw new Error('時給は0以上の数値である必要があります');
    }
    data.hourlyRate = updateData.hourlyRate !== null ? parseInt(updateData.hourlyRate) : null;
  }

  if (updateData.approvalStatus !== undefined) {
    const validApprovalStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validApprovalStatuses.includes(updateData.approvalStatus)) {
      throw new Error('無効な承認ステータスです');
    }
    data.approvalStatus = updateData.approvalStatus;
  }

  // ワーカーを更新
  const updatedWorker = await prisma.user.update({
    where: { id: workerId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      status: true,
      bio: true,
      hourlyRate: true,
      rating: true,
      reviewCount: true,
      approvalStatus: true,
      idDocumentUrl: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return updatedWorker;
};

/**
 * ワーカーを削除（管理者のみ）
 * @param {string} workerId - ワーカーID
 */
const deleteWorker = async (workerId) => {
  // ワーカーの存在確認
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { id: true, role: true, email: true }
  });

  if (!worker) {
    throw new Error('ワーカーが見つかりません');
  }

  if (worker.role !== 'WORKER') {
    throw new Error('指定されたユーザーはワーカーではありません');
  }

  // 関連データの確認
  const [bookingsCount, paymentsCount] = await Promise.all([
    prisma.booking.count({
      where: { workerId: workerId }
    }),
    prisma.payment.count({
      where: {
        booking: {
          workerId: workerId
        }
      }
    })
  ]);

  // ワーカーを削除
  await prisma.user.delete({
    where: { id: workerId }
  });

  return {
    message: 'ワーカーを削除しました',
    deletedWorker: {
      id: worker.id,
      email: worker.email
    },
    relatedData: {
      bookings: bookingsCount,
      payments: paymentsCount
    }
  };
};

/**
 * システム設定を取得（管理者のみ）
 * @param {string} category - カテゴリ（オプション）
 */
const getSystemSettings = async (category = null) => {
  const where = {};
  if (category) {
    where.category = category;
  }

  const settings = await prisma.systemSettings.findMany({
    where,
    orderBy: {
      key: 'asc'
    }
  });

  // キー・バリューのオブジェクトに変換
  const settingsObj = {};
  settings.forEach(setting => {
    settingsObj[setting.key] = {
      value: setting.value,
      description: setting.description,
      category: setting.category,
      updatedAt: setting.updatedAt
    };
  });

  return settingsObj;
};

/**
 * システム設定を更新（管理者のみ）
 * @param {object} settings - 設定オブジェクト（key: value形式）
 */
const updateSystemSettings = async (settings) => {
  const updates = [];

  for (const [key, value] of Object.entries(settings)) {
    // 値が文字列でない場合はJSON文字列に変換
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    updates.push(
      prisma.systemSettings.upsert({
        where: { key },
        update: {
          value: stringValue,
          updatedAt: new Date()
        },
        create: {
          key,
          value: stringValue,
          category: 'general'
        }
      })
    );
  }

  await Promise.all(updates);

  return await getSystemSettings();
};

/**
 * サービスメニュー一覧を取得（管理者のみ）
 */
const getServiceMenus = async () => {
  const services = await prisma.serviceMenu.findMany({
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  return services;
};

/**
 * サービスメニューを作成（管理者のみ）
 * @param {object} data - サービスメニューデータ
 */
const createServiceMenu = async (data) => {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('サービス名は必須です');
  }

  const service = await prisma.serviceMenu.create({
    data: {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      basePrice: data.basePrice ? parseInt(data.basePrice) : null,
      isActive: data.isActive !== false, // デフォルトはtrue
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0
    }
  });

  return service;
};

/**
 * サービスメニューを更新（管理者のみ）
 * @param {string} serviceId - サービスメニューID
 * @param {object} data - 更新データ
 */
const updateServiceMenu = async (serviceId, data) => {
  const service = await prisma.serviceMenu.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new Error('サービスメニューが見つかりません');
  }

  const updateData = {};

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('サービス名は必須です');
    }
    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description = data.description ? data.description.trim() : null;
  }

  if (data.basePrice !== undefined) {
    updateData.basePrice = data.basePrice !== null ? parseInt(data.basePrice) : null;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive === true;
  }

  if (data.displayOrder !== undefined) {
    updateData.displayOrder = parseInt(data.displayOrder);
  }

  const updatedService = await prisma.serviceMenu.update({
    where: { id: serviceId },
    data: updateData
  });

  return updatedService;
};

/**
 * サービスメニューを削除（管理者のみ）
 * @param {string} serviceId - サービスメニューID
 */
const deleteServiceMenu = async (serviceId) => {
  const service = await prisma.serviceMenu.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new Error('サービスメニューが見つかりません');
  }

  // このサービスを使用している予約があるか確認
  const bookingCount = await prisma.booking.count({
    where: { serviceType: service.name }
  });

  if (bookingCount > 0) {
    throw new Error('このサービスメニューを使用している予約があるため削除できません');
  }

  await prisma.serviceMenu.delete({
    where: { id: serviceId }
  });

  return {
    message: 'サービスメニューを削除しました',
    deletedService: {
      id: service.id,
      name: service.name
    }
  };
};

/**
 * 対応エリア一覧を取得（管理者のみ）
 */
const getAreas = async () => {
  const areas = await prisma.area.findMany({
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  return areas;
};

/**
 * 対応エリアを作成（管理者のみ）
 * @param {object} data - エリアデータ
 */
const createArea = async (data) => {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('エリア名は必須です');
  }

  const area = await prisma.area.create({
    data: {
      name: data.name.trim(),
      prefecture: data.prefecture ? data.prefecture.trim() : null,
      postalCode: data.postalCode ? data.postalCode.trim() : null,
      isActive: data.isActive !== false, // デフォルトはtrue
      displayOrder: data.displayOrder ? parseInt(data.displayOrder) : 0
    }
  });

  return area;
};

/**
 * 対応エリアを更新（管理者のみ）
 * @param {string} areaId - エリアID
 * @param {object} data - 更新データ
 */
const updateArea = async (areaId, data) => {
  const area = await prisma.area.findUnique({
    where: { id: areaId }
  });

  if (!area) {
    throw new Error('対応エリアが見つかりません');
  }

  const updateData = {};

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('エリア名は必須です');
    }
    updateData.name = data.name.trim();
  }

  if (data.prefecture !== undefined) {
    updateData.prefecture = data.prefecture ? data.prefecture.trim() : null;
  }

  if (data.postalCode !== undefined) {
    updateData.postalCode = data.postalCode ? data.postalCode.trim() : null;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive === true;
  }

  if (data.displayOrder !== undefined) {
    updateData.displayOrder = parseInt(data.displayOrder);
  }

  const updatedArea = await prisma.area.update({
    where: { id: areaId },
    data: updateData
  });

  return updatedArea;
};

/**
 * 対応エリアを削除（管理者のみ）
 * @param {string} areaId - エリアID
 */
const deleteArea = async (areaId) => {
  const area = await prisma.area.findUnique({
    where: { id: areaId }
  });

  if (!area) {
    throw new Error('対応エリアが見つかりません');
  }

  // このエリアを使用している予約があるか確認（簡易チェック）
  // 実際の実装では、予約のaddressフィールドと照合する必要があるかもしれません
  // 現時点では削除を許可します

  await prisma.area.delete({
    where: { id: areaId }
  });

  return {
    message: '対応エリアを削除しました',
    deletedArea: {
      id: area.id,
      name: area.name
    }
  };
};

module.exports = {
  getUsers,
  getWorkers,
  approveWorker,
  updateUser,
  deleteUser,
  updateWorker,
  deleteWorker,
  getBookingReport,
  getRevenueReport,
  getUserReport,
  getWorkerReport,
  createSystemNotification,
  getChartData,
  getComparisonReport,
  getCustomReport,
  getSystemSettings,
  updateSystemSettings,
  getServiceMenus,
  createServiceMenu,
  updateServiceMenu,
  deleteServiceMenu,
  getAreas,
  createArea,
  updateArea,
  deleteArea
};
