const prisma = require('../config/database');
const logger = require('../config/logger');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const aiWorkerTestReviewService = require('./aiWorkerTestReviewService');

const FINAL_STATUSES = ['ADMIN_PASSED', 'ADMIN_FAILED'];
const OPEN_STATUSES = ['TEST_SUBMITTED', 'AI_REVIEWED', 'NEEDS_REVIEW'];

const httpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toDbAiDecision = (decision) => ({
  pass_candidate: 'PASS_CANDIDATE',
  fail_candidate: 'FAIL_CANDIDATE',
  needs_review: 'NEEDS_REVIEW'
}[decision] || 'NEEDS_REVIEW');

const toApiAiDecision = (decision) => ({
  PASS_CANDIDATE: 'pass_candidate',
  FAIL_CANDIDATE: 'fail_candidate',
  NEEDS_REVIEW: 'needs_review'
}[decision] || null);

const toApiStatus = (status) => ({
  TEST_SUBMITTED: 'test_submitted',
  AI_REVIEWED: 'ai_reviewed',
  NEEDS_REVIEW: 'needs_review',
  ADMIN_PASSED: 'admin_passed',
  ADMIN_FAILED: 'admin_failed'
}[status] || status);

const toDbStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  const statusMap = {
    TEST_SUBMITTED: 'TEST_SUBMITTED',
    AI_REVIEWED: 'AI_REVIEWED',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
    ADMIN_PASSED: 'ADMIN_PASSED',
    ADMIN_FAILED: 'ADMIN_FAILED'
  };
  return statusMap[normalized] || statusMap[normalized.replace(/-/g, '_')] || null;
};

const toApiAdminDecision = (decision) => ({
  PASSED: 'passed',
  FAILED: 'failed'
}[decision] || null);

const toDbAdminDecision = (decision) => ({
  passed: 'PASSED',
  failed: 'FAILED',
  PASSED: 'PASSED',
  FAILED: 'FAILED'
}[decision] || null);

const truncate = (value, maxLength) => {
  const text = String(value || '').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const formatSubmission = (submission, { includeAnswer = false } = {}) => {
  if (!submission) return null;

  const formatted = {
    id: submission.id,
    workerId: submission.workerId,
    status: toApiStatus(submission.status),
    aiScore: submission.aiScore,
    aiInitialDecision: toApiAiDecision(submission.aiInitialDecision),
    aiReason: submission.aiReason,
    aiWarnings: Array.isArray(submission.aiWarnings) ? submission.aiWarnings : [],
    aiReviewedAt: submission.aiReviewedAt,
    aiErrorMessage: submission.aiErrorMessage,
    adminFinalDecision: toApiAdminDecision(submission.adminFinalDecision),
    adminComment: submission.adminComment,
    reviewedByAdminId: submission.reviewedByAdminId,
    reviewedAt: submission.reviewedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt
  };

  if (includeAnswer) {
    formatted.testAnswer = submission.testAnswer;
  }

  if (submission.worker) {
    formatted.worker = submission.worker;
  }

  if (submission.reviewedByAdmin) {
    formatted.reviewedByAdmin = submission.reviewedByAdmin;
  }

  return formatted;
};

const validateWorkerCanSubmit = async (workerId) => {
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: {
      id: true,
      role: true,
      approvalStatus: true,
      status: true
    }
  });

  if (!worker) {
    throw httpError('ワーカーが見つかりません', 404);
  }

  if (worker.role !== 'WORKER') {
    throw httpError('ワーカーのみテスト回答を提出できます', 403);
  }

  if (worker.status !== 'ACTIVE') {
    throw httpError('このアカウントではテスト回答を提出できません', 403);
  }

  if (worker.approvalStatus !== 'PENDING') {
    throw httpError('審査中のワーカーのみテスト回答を提出できます', 409);
  }
};

const buildAiUpdateData = (aiReview) => {
  const aiInitialDecision = toDbAiDecision(aiReview.initialDecision);

  return {
    aiScore: aiReview.score,
    aiInitialDecision,
    aiReason: aiReview.reason || null,
    aiWarnings: aiReview.warnings || [],
    aiReviewedAt: new Date(),
    aiErrorMessage: aiReview.errorMessage ? truncate(aiReview.errorMessage, 500) : null,
    status: aiInitialDecision === 'NEEDS_REVIEW' ? 'NEEDS_REVIEW' : 'AI_REVIEWED'
  };
};

const submitWorkerTest = async (workerId, payload = {}) => {
  const testAnswer = String(payload.testAnswer || '').trim();

  if (!testAnswer) {
    throw httpError('テスト回答は必須です');
  }

  if (testAnswer.length > 20000) {
    throw httpError('テスト回答は20000文字以内で入力してください');
  }

  await validateWorkerCanSubmit(workerId);

  const existingOpenSubmission = await prisma.workerTestSubmission.findFirst({
    where: {
      workerId,
      status: { in: OPEN_STATUSES }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingOpenSubmission) {
    throw httpError('未確定のテスト回答が既に存在します', 409);
  }

  const submission = await prisma.workerTestSubmission.create({
    data: {
      workerId,
      testAnswer,
      status: 'TEST_SUBMITTED'
    }
  });

  const aiReview = await aiWorkerTestReviewService.judgeWorkerTestAnswer({
    testAnswer,
    submissionId: submission.id,
    workerId
  });

  const updatedSubmission = await prisma.workerTestSubmission.update({
    where: { id: submission.id },
    data: buildAiUpdateData(aiReview)
  });

  return formatSubmission(updatedSubmission, { includeAnswer: true });
};

const getLatestSubmissionForWorker = async (workerId) => {
  const submission = await prisma.workerTestSubmission.findFirst({
    where: { workerId },
    orderBy: { createdAt: 'desc' }
  });

  return formatSubmission(submission, { includeAnswer: true });
};

const getAdminSubmissions = async (filters = {}) => {
  const { page = 1, limit = 20 } = filters;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : String(filters.status).split(',');
    const dbStatuses = statuses.map(toDbStatus).filter(Boolean);
    if (dbStatuses.length > 0) {
      where.status = { in: dbStatuses };
    }
  }

  const [submissions, total] = await Promise.all([
    prisma.workerTestSubmission.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            approvalStatus: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    }),
    prisma.workerTestSubmission.count({ where })
  ]);

  return {
    submissions: submissions.map((submission) => formatSubmission(submission)),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

const getAdminSubmissionById = async (submissionId) => {
  const submission = await prisma.workerTestSubmission.findUnique({
    where: { id: submissionId },
    include: {
      worker: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          status: true,
          approvalStatus: true,
          bio: true,
          hourlyRate: true,
          serviceAreaText: true,
          availabilityText: true,
          idDocumentUrl: true,
          createdAt: true,
          updatedAt: true
        }
      },
      reviewedByAdmin: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  if (!submission) {
    throw httpError('ワーカーテスト回答が見つかりません', 404);
  }

  return formatSubmission(submission, { includeAnswer: true });
};

const notifyWorkerFinalDecision = async (workerId, approvalStatus, worker) => {
  try {
    const notificationType = approvalStatus === 'APPROVED' ? 'WORKER_APPROVED' : 'WORKER_REJECTED';
    const title = approvalStatus === 'APPROVED' ? 'ワーカー承認が完了しました' : 'ワーカー承認が却下されました';
    const content = approvalStatus === 'APPROVED'
      ? 'おめでとうございます！ワーカーとして承認されました。予約を受け付けることができます。'
      : '申し訳ございませんが、ワーカー承認が却下されました。詳細についてはサポートまでお問い合わせください。';

    await notificationService.createNotification(workerId, notificationType, title, content, null, 'SYSTEM');
  } catch (error) {
    logger.warn('Worker final review notification failed', { workerId, error: error.message });
  }

  try {
    if (worker && worker.email) {
      await emailService.sendWorkerApprovalEmail(worker.email, worker.name, approvalStatus);
    }
  } catch (error) {
    logger.warn('Worker final review email failed', { workerId, error: error.message });
  }
};

const finalizeAdminReview = async (submissionId, adminId, payload = {}) => {
  const adminFinalDecision = toDbAdminDecision(payload.adminFinalDecision);
  const adminComment = payload.adminComment !== undefined ? truncate(payload.adminComment, 5000) : null;

  if (!adminFinalDecision) {
    throw httpError('adminFinalDecision は passed または failed を指定してください');
  }

  const approvalStatus = adminFinalDecision === 'PASSED' ? 'APPROVED' : 'REJECTED';
  const submissionStatus = adminFinalDecision === 'PASSED' ? 'ADMIN_PASSED' : 'ADMIN_FAILED';

  const result = await prisma.$transaction(async (tx) => {
    const submission = await tx.workerTestSubmission.findUnique({
      where: { id: submissionId },
      include: {
        worker: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            approvalStatus: true
          }
        }
      }
    });

    if (!submission) {
      throw httpError('ワーカーテスト回答が見つかりません', 404);
    }

    if (!submission.worker || submission.worker.role !== 'WORKER') {
      throw httpError('対象ワーカーが見つかりません', 404);
    }

    if (FINAL_STATUSES.includes(submission.status)) {
      throw httpError('このテスト回答は既に最終判定済みです', 409);
    }

    const updatedSubmission = await tx.workerTestSubmission.update({
      where: { id: submissionId },
      data: {
        adminFinalDecision,
        adminComment,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
        status: submissionStatus
      },
      include: {
        worker: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            approvalStatus: true,
            createdAt: true
          }
        },
        reviewedByAdmin: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    const updatedWorker = await tx.user.update({
      where: { id: submission.workerId },
      data: { approvalStatus },
      select: {
        id: true,
        email: true,
        name: true,
        approvalStatus: true
      }
    });

    return { submission: updatedSubmission, worker: updatedWorker };
  });

  await notifyWorkerFinalDecision(result.worker.id, approvalStatus, result.worker);

  result.submission.worker.approvalStatus = approvalStatus;

  return formatSubmission(result.submission, { includeAnswer: true });
};

module.exports = {
  FINAL_STATUSES,
  formatSubmission,
  finalizeAdminReview,
  getAdminSubmissionById,
  getAdminSubmissions,
  getLatestSubmissionForWorker,
  submitWorkerTest,
  toApiAiDecision,
  toApiStatus,
  toDbStatus
};
