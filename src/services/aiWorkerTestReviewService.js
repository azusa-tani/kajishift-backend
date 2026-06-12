const logger = require('../config/logger');

const VALID_INITIAL_DECISIONS = new Set(['pass_candidate', 'fail_candidate', 'needs_review']);
const DEFAULT_MODEL = process.env.OPENAI_WORKER_TEST_MODEL || 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 8000;

let openAiClient = null;

const getAiEnabled = () => String(process.env.ENABLE_AI_WORKER_TEST_REVIEW || '').toLowerCase() === 'true';

const getOpenAiClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!openAiClient) {
    const OpenAI = require('openai');
    openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openAiClient;
};

const redactPersonalInfo = (text) => String(text || '')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
  .replace(/(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, '[redacted-phone]');

const buildWorkerTestReviewPrompt = (testAnswer) => {
  const redactedAnswer = redactPersonalInfo(testAnswer);

  return [
    {
      role: 'system',
      content: [
        'あなたは家事代行サービスKAJISHIFTのワーカーテスト回答を一次判定する審査補助AIです。',
        'AI判定は最終合否ではありません。管理者が必ず最終判定します。',
        '回答の具体性、安全意識、緊急時対応、利用者への配慮、業務理解を総合的に見てください。',
        '判断が難しい場合、個人情報が多い場合、重要な説明が不足する場合は needs_review にしてください。',
        '出力はJSONのみです。Markdownや説明文を追加しないでください。',
        'JSON schema: {"score": 0-100の整数, "initialDecision": "pass_candidate"|"fail_candidate"|"needs_review", "reason": "短い日本語理由", "warnings": ["注意点"]}'
      ].join('\n')
    },
    {
      role: 'user',
      content: `判定対象のワーカーテスト回答:\n${redactedAnswer}`
    }
  ];
};

const extractJsonObject = (raw) => {
  const text = String(raw || '').trim();
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    throw new Error('AI review response does not contain a JSON object');
  }

  return candidate.slice(start, end + 1);
};

const normalizeScore = (score) => {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(numericScore)));
};

const normalizeWarnings = (warnings) => {
  if (!Array.isArray(warnings)) {
    return [];
  }

  return warnings
    .map((warning) => String(warning || '').trim())
    .filter(Boolean)
    .slice(0, 10);
};

const createNeedsReviewResult = (message = 'AI判定を完了できなかったため、管理者確認に回します。') => ({
  ok: false,
  score: null,
  initialDecision: 'needs_review',
  reason: message,
  warnings: [],
  errorMessage: message
});

const normalizeAiReviewPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return createNeedsReviewResult('AI判定レスポンスの形式が不正です。');
  }

  const initialDecision = VALID_INITIAL_DECISIONS.has(payload.initialDecision)
    ? payload.initialDecision
    : 'needs_review';

  return {
    ok: true,
    score: normalizeScore(payload.score),
    initialDecision,
    reason: String(payload.reason || 'AI判定理由が返されませんでした。').trim(),
    warnings: normalizeWarnings(payload.warnings),
    errorMessage: null
  };
};

const parseAiReviewResponse = (raw) => {
  try {
    const json = extractJsonObject(raw);
    return normalizeAiReviewPayload(JSON.parse(json));
  } catch (error) {
    return createNeedsReviewResult('AI判定レスポンスの解析に失敗しました。');
  }
};

const withTimeout = (promise, timeoutMs) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('AI review request timed out'));
  }, timeoutMs);

  promise
    .then(resolve)
    .catch(reject)
    .finally(() => clearTimeout(timeout));
});

const judgeWorkerTestAnswer = async ({ testAnswer, submissionId, workerId }) => {
  if (!getAiEnabled()) {
    return createNeedsReviewResult('AI判定が無効のため、管理者確認に回します。');
  }

  try {
    const client = getOpenAiClient();
    const timeoutMs = Number(process.env.OPENAI_WORKER_TEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    const completion = await withTimeout(
      client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: buildWorkerTestReviewPrompt(testAnswer),
        temperature: 0,
        response_format: { type: 'json_object' }
      }),
      timeoutMs
    );

    const content = completion.choices && completion.choices[0] && completion.choices[0].message
      ? completion.choices[0].message.content
      : '';

    return parseAiReviewResponse(content);
  } catch (error) {
    logger.warn('Worker test AI review failed', {
      submissionId,
      workerId,
      error: error.message
    });

    return createNeedsReviewResult('AI判定に失敗したため、管理者確認に回します。');
  }
};

module.exports = {
  buildWorkerTestReviewPrompt,
  createNeedsReviewResult,
  judgeWorkerTestAnswer,
  normalizeAiReviewPayload,
  parseAiReviewResponse,
  redactPersonalInfo
};
