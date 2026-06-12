const assert = require('assert');
const {
  judgeWorkerTestAnswer,
  normalizeAiReviewPayload,
  parseAiReviewResponse,
  redactPersonalInfo
} = require('../src/services/aiWorkerTestReviewService');

const parsed = parseAiReviewResponse(JSON.stringify({
  score: 85,
  initialDecision: 'pass_candidate',
  reason: '回答が具体的で、安全意識も確認できます。',
  warnings: ['緊急時対応の説明を補足してください。']
}));

assert.equal(parsed.ok, true);
assert.equal(parsed.score, 85);
assert.equal(parsed.initialDecision, 'pass_candidate');
assert.deepEqual(parsed.warnings, ['緊急時対応の説明を補足してください。']);

const fenced = parseAiReviewResponse(`\`\`\`json
{
  "score": 73.6,
  "initialDecision": "fail_candidate",
  "reason": "重要項目の説明不足です。",
  "warnings": "not-array"
}
\`\`\``);

assert.equal(fenced.score, 74);
assert.equal(fenced.initialDecision, 'fail_candidate');
assert.deepEqual(fenced.warnings, []);

const unknownDecision = normalizeAiReviewPayload({
  score: 150,
  initialDecision: 'auto_pass',
  reason: '',
  warnings: ['a']
});

assert.equal(unknownDecision.score, 100);
assert.equal(unknownDecision.initialDecision, 'needs_review');
assert.equal(unknownDecision.reason, 'AI判定理由が返されませんでした。');

const parseFailure = parseAiReviewResponse('not json');

assert.equal(parseFailure.ok, false);
assert.equal(parseFailure.score, null);
assert.equal(parseFailure.initialDecision, 'needs_review');
assert(parseFailure.errorMessage.includes('解析に失敗'));

const redacted = redactPersonalInfo('連絡先は worker@example.com と 090-1234-5678 です。');

assert(!redacted.includes('worker@example.com'));
assert(!redacted.includes('090-1234-5678'));
assert(redacted.includes('[redacted-email]'));
assert(redacted.includes('[redacted-phone]'));

(async () => {
  const originalEnabled = process.env.ENABLE_AI_WORKER_TEST_REVIEW;
  const originalApiKey = process.env.OPENAI_API_KEY;
  process.env.ENABLE_AI_WORKER_TEST_REVIEW = 'false';
  delete process.env.OPENAI_API_KEY;

  const disabledResult = await judgeWorkerTestAnswer({
    testAnswer: '回答本文',
    submissionId: 'submission_1',
    workerId: 'worker_1'
  });

  assert.equal(disabledResult.initialDecision, 'needs_review');
  assert.equal(disabledResult.ok, false);

  if (originalEnabled === undefined) {
    delete process.env.ENABLE_AI_WORKER_TEST_REVIEW;
  } else {
    process.env.ENABLE_AI_WORKER_TEST_REVIEW = originalEnabled;
  }

  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }

  console.log('AI worker test review parsing passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
