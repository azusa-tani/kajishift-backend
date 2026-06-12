const assert = require('assert');

const dbPath = require.resolve('../src/config/database');
const aiPath = require.resolve('../src/services/aiWorkerTestReviewService');
const emailPath = require.resolve('../src/services/emailService');
const notificationPath = require.resolve('../src/services/notificationService');

const calls = {
  events: [],
  submissionUpdates: [],
  userUpdates: []
};

let hasAdminPassedSubmission = false;

const prismaMock = {
  user: {
    findUnique: async () => ({
      id: 'worker_1',
      role: 'WORKER',
      status: 'ACTIVE',
      approvalStatus: 'PENDING'
    }),
    update: async ({ data }) => {
      calls.userUpdates.push(data);
      return {
        id: 'worker_1',
        email: 'worker@example.com',
        name: 'ワーカー',
        phone: null,
        status: 'ACTIVE',
        bio: null,
        hourlyRate: null,
        rating: null,
        reviewCount: 0,
        approvalStatus: data.approvalStatus,
        createdAt: new Date('2026-06-08T00:00:00.000Z'),
        updatedAt: new Date('2026-06-08T00:00:02.000Z')
      };
    }
  },
  workerTestSubmission: {
    findFirst: async ({ where } = {}) => {
      if (where?.status === 'ADMIN_PASSED') {
        return hasAdminPassedSubmission ? { id: 'submission_passed' } : null;
      }
      return null;
    },
    create: async ({ data }) => {
      calls.events.push('create-submission');
      return {
        id: 'submission_1',
        ...data,
        createdAt: new Date('2026-06-08T00:00:00.000Z'),
        updatedAt: new Date('2026-06-08T00:00:00.000Z')
      };
    },
    update: async ({ data }) => {
      calls.submissionUpdates.push(data);
      return {
        id: 'submission_1',
        workerId: 'worker_1',
        testAnswer: '回答本文',
        ...data,
        createdAt: new Date('2026-06-08T00:00:00.000Z'),
        updatedAt: new Date('2026-06-08T00:00:01.000Z')
      };
    }
  },
  $transaction: async (callback) => callback({
    workerTestSubmission: {
      findUnique: async () => ({
        id: 'submission_1',
        workerId: 'worker_1',
        status: 'AI_REVIEWED',
        aiScore: 85,
        aiInitialDecision: 'PASS_CANDIDATE',
        aiReason: 'AI理由',
        aiWarnings: ['注意点'],
        worker: {
          id: 'worker_1',
          email: 'worker@example.com',
          name: 'ワーカー',
          role: 'WORKER',
          approvalStatus: 'PENDING'
        }
      }),
      update: async ({ data }) => {
        calls.submissionUpdates.push(data);
        return {
          id: 'submission_1',
          workerId: 'worker_1',
          testAnswer: '回答本文',
          aiScore: 85,
          aiInitialDecision: 'PASS_CANDIDATE',
          aiReason: 'AI理由',
          aiWarnings: ['注意点'],
          aiReviewedAt: new Date('2026-06-08T00:00:01.000Z'),
          aiErrorMessage: null,
          ...data,
          worker: {
            id: 'worker_1',
            email: 'worker@example.com',
            name: 'ワーカー',
            phone: null,
            status: 'ACTIVE',
            approvalStatus: 'PENDING',
            createdAt: new Date('2026-06-08T00:00:00.000Z')
          },
          reviewedByAdmin: {
            id: data.reviewedByAdminId,
            email: 'admin@example.com',
            name: '管理者'
          },
          createdAt: new Date('2026-06-08T00:00:00.000Z'),
          updatedAt: new Date('2026-06-08T00:00:02.000Z')
        };
      }
    },
    user: {
      update: async ({ data }) => {
        calls.userUpdates.push(data);
        return {
          id: 'worker_1',
          email: 'worker@example.com',
          name: 'ワーカー',
          approvalStatus: data.approvalStatus
        };
      }
    }
  })
};

const aiMock = {
  result: {
    score: 92,
    initialDecision: 'pass_candidate',
    reason: '十分な回答です。',
    warnings: [],
    errorMessage: null
  },
  judgeWorkerTestAnswer: async () => {
    calls.events.push('ai-review');
    return aiMock.result;
  }
};

require.cache[dbPath] = { exports: prismaMock };
require.cache[aiPath] = { exports: aiMock };
require.cache[emailPath] = { exports: { sendWorkerApprovalEmail: async () => undefined } };
require.cache[notificationPath] = { exports: { createNotification: async () => undefined } };

const { authorize } = require('../src/middleware/auth');
const workerTestSubmissionService = require('../src/services/workerTestSubmissionService');
const adminService = require('../src/services/adminService');

const runAuthorize = (user) => new Promise((resolve) => {
  const req = { user };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      resolve({ statusCode: this.statusCode, body });
    }
  };

  authorize('ADMIN')(req, res, () => resolve({ nextCalled: true }));
});

(async () => {
  assert.equal((await runAuthorize(null)).statusCode, 401);
  assert.equal((await runAuthorize({ id: 'worker_1', role: 'WORKER' })).statusCode, 403);
  assert.deepEqual(await runAuthorize({ id: 'admin_1', role: 'ADMIN' }), { nextCalled: true });

  calls.events = [];
  calls.submissionUpdates = [];
  calls.userUpdates = [];
  aiMock.result = {
    score: 92,
    initialDecision: 'pass_candidate',
    reason: '十分な回答です。',
    warnings: [],
    errorMessage: null
  };

  const submitted = await workerTestSubmissionService.submitWorkerTest('worker_1', {
    testAnswer: '回答本文'
  });

  assert.deepEqual(calls.events, ['create-submission', 'ai-review']);
  assert.equal(submitted.status, 'ai_reviewed');
  assert.equal(calls.userUpdates.length, 0, 'AI一次判定ではUser.approvalStatusを更新しない');

  calls.events = [];
  calls.submissionUpdates = [];
  calls.userUpdates = [];
  aiMock.result = {
    score: null,
    initialDecision: 'needs_review',
    reason: 'AI失敗',
    warnings: [],
    errorMessage: 'AI失敗'
  };

  const needsReview = await workerTestSubmissionService.submitWorkerTest('worker_1', {
    testAnswer: '回答本文'
  });

  assert.deepEqual(calls.events, ['create-submission', 'ai-review']);
  assert.equal(needsReview.status, 'needs_review');
  assert.equal(needsReview.testAnswer, '回答本文');
  assert.equal(calls.userUpdates.length, 0, 'AI失敗時もUser.approvalStatusを更新しない');

  calls.submissionUpdates = [];
  calls.userUpdates = [];
  const passed = await workerTestSubmissionService.finalizeAdminReview('submission_1', 'admin_real', {
    adminFinalDecision: 'passed',
    adminComment: '合格です',
    reviewedByAdminId: 'admin_from_body'
  });

  const passUpdate = calls.submissionUpdates[0];
  assert.equal(passUpdate.adminFinalDecision, 'PASSED');
  assert.equal(passUpdate.adminComment, '合格です');
  assert.equal(passUpdate.reviewedByAdminId, 'admin_real');
  assert(passUpdate.reviewedAt instanceof Date);
  assert.equal(passUpdate.status, 'ADMIN_PASSED');
  assert(!Object.prototype.hasOwnProperty.call(passUpdate, 'aiScore'));
  assert(!Object.prototype.hasOwnProperty.call(passUpdate, 'aiInitialDecision'));
  assert.deepEqual(calls.userUpdates[0], { approvalStatus: 'APPROVED' });
  assert.equal(passed.worker.approvalStatus, 'APPROVED');

  calls.submissionUpdates = [];
  calls.userUpdates = [];
  const failed = await workerTestSubmissionService.finalizeAdminReview('submission_1', 'admin_real', {
    adminFinalDecision: 'failed',
    adminComment: '不合格です'
  });

  assert.equal(calls.submissionUpdates[0].adminFinalDecision, 'FAILED');
  assert.equal(calls.submissionUpdates[0].status, 'ADMIN_FAILED');
  assert.deepEqual(calls.userUpdates[0], { approvalStatus: 'REJECTED' });
  assert.equal(failed.worker.approvalStatus, 'REJECTED');

  calls.userUpdates = [];
  hasAdminPassedSubmission = false;
  await assert.rejects(
    () => adminService.approveWorker('worker_1', 'admin_real', 'APPROVED'),
    (error) => error.status === 409 && /直接承認できません/.test(error.message)
  );
  assert.equal(calls.userUpdates.length, 0, '旧承認APIは最終合格前にUser.approvalStatusを更新しない');

  await assert.rejects(
    () => adminService.updateWorker('worker_1', { approvalStatus: 'APPROVED' }),
    (error) => error.status === 409 && /直接承認できません/.test(error.message)
  );
  assert.equal(calls.userUpdates.length, 0, '汎用ワーカー更新APIも最終合格前にUser.approvalStatusを更新しない');

  hasAdminPassedSubmission = true;
  const legacyApproved = await adminService.approveWorker('worker_1', 'admin_real', 'APPROVED');
  assert.equal(legacyApproved.approvalStatus, 'APPROVED');
  assert.deepEqual(calls.userUpdates[calls.userUpdates.length - 1], { approvalStatus: 'APPROVED' });

  const updatedApproved = await adminService.updateWorker('worker_1', { approvalStatus: 'APPROVED' });
  assert.equal(updatedApproved.approvalStatus, 'APPROVED');
  assert.deepEqual(calls.userUpdates[calls.userUpdates.length - 1], { approvalStatus: 'APPROVED' });

  console.log('Worker test submission flow passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
