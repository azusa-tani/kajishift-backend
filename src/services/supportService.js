/**
 * サポート管理サービス
 */

const prisma = require('../config/database');

/**
 * 問い合わせ一覧を取得
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 * @param {object} filters - フィルター（status, page, limit）
 */
const getSupportTickets = async (userId, userRole, filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // クエリ条件を構築
  const where = {};

  // ロールに応じてフィルター
  if (userRole === 'CUSTOMER' || userRole === 'WORKER') {
    where.userId = userId;
  } else if (userRole === 'ADMIN') {
    // 管理者はすべての問い合わせを取得
  } else {
    throw new Error('問い合わせ一覧を取得できるのは認証済みユーザーまたは管理者のみです');
  }

  // ステータスフィルター
  if (status) {
    where.status = status;
  }

  // 問い合わせを取得
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    }),
    prisma.supportTicket.count({ where })
  ]);

  return {
    tickets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

/**
 * 問い合わせを作成
 * @param {string} userId - ユーザーID
 * @param {string} subject - 件名
 * @param {string} content - 内容
 */
const createSupportTicket = async (userId, subject, content) => {
  // 必須フィールドのチェック
  if (!subject || subject.trim().length === 0) {
    throw new Error('件名は必須です');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('内容は必須です');
  }

  if (subject.length > 200) {
    throw new Error('件名は200文字以内で入力してください');
  }

  if (content.length > 5000) {
    throw new Error('内容は5000文字以内で入力してください');
  }

  // ユーザーの存在確認
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true }
  });

  if (!user) {
    throw new Error('ユーザーが見つかりません');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('アカウントが無効です');
  }

  // 問い合わせを作成
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: subject.trim(),
      content: content.trim(),
      status: 'OPEN'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  return ticket;
};

/**
 * 問い合わせ詳細を取得
 * @param {string} ticketId - 問い合わせID
 * @param {string} userId - ユーザーID
 * @param {string} userRole - ユーザーロール
 */
const getSupportTicketById = async (ticketId, userId, userRole) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!ticket) {
    throw new Error('問い合わせが見つかりません');
  }

  // 権限チェック：作成者または管理者のみアクセス可能
  if (userRole !== 'ADMIN' && ticket.userId !== userId) {
    throw new Error('この問い合わせにアクセスする権限がありません');
  }

  return ticket;
};

/**
 * サポートチケットを更新（管理者のみ）
 * @param {string} ticketId - チケットID
 * @param {string} adminId - 管理者ID
 * @param {object} updateData - 更新データ（status, adminResponse, adminId）
 */
const updateSupportTicket = async (ticketId, adminId, updateData) => {
  // チケットの存在確認
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true }
  });

  if (!ticket) {
    throw new Error('問い合わせが見つかりません');
  }

  // 更新可能なフィールドを構築
  const data = {};

  if (updateData.status !== undefined) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error('無効なステータスです');
    }
    data.status = updateData.status;
  }

  if (updateData.adminResponse !== undefined) {
    if (updateData.adminResponse && updateData.adminResponse.length > 5000) {
      throw new Error('管理者の返信は5000文字以内で入力してください');
    }
    data.adminResponse = updateData.adminResponse ? updateData.adminResponse.trim() : null;
  }

  // 管理者IDを設定（ステータスがIN_PROGRESSまたはCLOSEDの場合）
  if (updateData.status === 'IN_PROGRESS' || updateData.status === 'CLOSED') {
    data.adminId = adminId;
  } else if (updateData.adminId !== undefined) {
    // 明示的に管理者IDが指定された場合
    data.adminId = updateData.adminId;
  }

  // チケットを更新
  const updatedTicket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  return updatedTicket;
};

/**
 * サポートチケットを削除（管理者のみ）
 * @param {string} ticketId - チケットID
 */
const deleteSupportTicket = async (ticketId) => {
  // チケットの存在確認
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, subject: true, status: true }
  });

  if (!ticket) {
    throw new Error('問い合わせが見つかりません');
  }

  // チケットを削除
  await prisma.supportTicket.delete({
    where: { id: ticketId }
  });

  return {
    message: '問い合わせを削除しました',
    deletedTicket: {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status
    }
  };
};

module.exports = {
  getSupportTickets,
  createSupportTicket,
  getSupportTicketById,
  updateSupportTicket,
  deleteSupportTicket
};
