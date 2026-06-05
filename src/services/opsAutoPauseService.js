const prisma = require('../config/database');
const logger = require('../config/logger');
const { getOperationStatus, setOperationMode } = require('../config/operationMode');
const alertService = require('./alertService');

const DEFAULT_WINDOW_MINUTES = Number(process.env.OPS_AUTOPAUSE_WINDOW_MINUTES || 10);
const WEBHOOK_FAILURE_THRESHOLD = Number(process.env.OPS_WEBHOOK_FAILURE_THRESHOLD || 3);
const PAYMENT_ANOMALY_THRESHOLD = Number(process.env.OPS_PAYMENT_ANOMALY_THRESHOLD || 1);
const DB_FAILURE_THRESHOLD = Number(process.env.OPS_DB_FAILURE_THRESHOLD || 2);
const API_5XX_THRESHOLD = Number(process.env.OPS_API_5XX_THRESHOLD || 10);

const sinceDate = (windowMinutes = DEFAULT_WINDOW_MINUTES) => {
  return new Date(Date.now() - windowMinutes * 60 * 1000);
};

const recordOpsEvent = async ({
  type,
  severity = 'warning',
  source = 'app',
  fingerprint = null,
  paymentId = null,
  stripeEventId = null,
  message,
  metadata = {}
}) => {
  const event = await prisma.opsEvent.create({
    data: {
      type,
      severity,
      source,
      fingerprint,
      paymentId,
      stripeEventId,
      message,
      metadata
    }
  });

  logger.warn('Ops event recorded', {
    type,
    severity,
    source,
    fingerprint,
    paymentId,
    stripeEventId,
    message
  });

  return event;
};

const countRecentEvents = async (types, windowMinutes = DEFAULT_WINDOW_MINUTES) => {
  return prisma.opsEvent.count({
    where: {
      type: { in: Array.isArray(types) ? types : [types] },
      createdAt: { gte: sinceDate(windowMinutes) }
    }
  });
};

const autoPause = async ({
  mode,
  reason,
  trigger,
  severity = 'critical',
  impact = null,
  recoveryHints = [],
  metadata = {}
}) => {
  const current = await getOperationStatus();
  if (current.mode === mode || current.mode === 'maintenance') {
    return { changed: false, current };
  }

  const status = await setOperationMode({
    mode,
    reason,
    trigger,
    severity,
    message: reason,
    metadata,
    source: 'auto'
  });

  await alertService.sendOpsAlert({
    title: `KAJISHIFT auto-paused: ${mode}`,
    severity,
    message: reason,
    currentMode: status.mode,
    reason,
    impact: impact || (mode === 'maintenance'
      ? '書き込み系APIを停止し、β版を読み取り中心に切り替えました。'
      : '新規予約、決済開始、カード登録を停止しました。Stripe Webhook受信は継続します。'),
    recoveryHints: recoveryHints.length > 0 ? recoveryHints : [
      'GET /api/public/status で現在モードを確認してください。',
      'OpsIncident と OpsEvent を確認してください。',
      '復旧前チェックが全てPASSするまで normal に戻さないでください。'
    ],
    details: {
      trigger,
      mode,
      previousMode: current.mode,
      ...metadata
    }
  });

  return { changed: true, status };
};

const evaluatePaymentCircuitBreaker = async () => {
  const webhookFailures = await countRecentEvents([
    'stripe_webhook_failure',
    'stripe_payment_not_found',
    'stripe_payment_update_failure'
  ]);
  if (webhookFailures >= WEBHOOK_FAILURE_THRESHOLD) {
    return autoPause({
      mode: 'payment_paused',
      trigger: 'auto:webhook_failure_threshold',
      reason: `Stripe Webhook関連の失敗が${DEFAULT_WINDOW_MINUTES}分以内に${webhookFailures}件発生したため、決済受付を自動停止しました。`,
      metadata: { webhookFailures, threshold: WEBHOOK_FAILURE_THRESHOLD }
    });
  }

  const anomalies = await countRecentEvents([
    'payment_reconciliation_anomaly',
    'payment_amount_mismatch',
    'payment_metadata_mismatch',
    'stripe_event_processing_missing',
    'stripe_event_processing_failed'
  ]);
  if (anomalies >= PAYMENT_ANOMALY_THRESHOLD) {
    return autoPause({
      mode: 'payment_paused',
      trigger: 'auto:payment_anomaly_threshold',
      reason: `決済整合性異常が${DEFAULT_WINDOW_MINUTES}分以内に${anomalies}件発生したため、決済受付を自動停止しました。`,
      metadata: { anomalies, threshold: PAYMENT_ANOMALY_THRESHOLD }
    });
  }

  return { changed: false };
};

const evaluateMaintenanceCircuitBreaker = async () => {
  const dbFailures = await countRecentEvents('db_health_failure');
  if (dbFailures >= DB_FAILURE_THRESHOLD) {
    return autoPause({
      mode: 'maintenance',
      trigger: 'auto:db_failure_threshold',
      reason: `DB接続失敗が${DEFAULT_WINDOW_MINUTES}分以内に${dbFailures}件発生したため、メンテナンスへ自動切替しました。`,
      metadata: { dbFailures, threshold: DB_FAILURE_THRESHOLD }
    });
  }

  const api5xxFailures = await countRecentEvents('api_5xx_error');
  if (api5xxFailures >= API_5XX_THRESHOLD) {
    return autoPause({
      mode: 'maintenance',
      trigger: 'auto:api_5xx_threshold',
      reason: `API 5xxエラーが${DEFAULT_WINDOW_MINUTES}分以内に${api5xxFailures}件発生したため、メンテナンスへ自動切替しました。`,
      metadata: { api5xxFailures, threshold: API_5XX_THRESHOLD }
    });
  }

  return { changed: false };
};

const evaluateCircuitBreakers = async () => {
  const paymentResult = await evaluatePaymentCircuitBreaker();
  const maintenanceResult = await evaluateMaintenanceCircuitBreaker();
  return { paymentResult, maintenanceResult };
};

module.exports = {
  recordOpsEvent,
  countRecentEvents,
  autoPause,
  evaluatePaymentCircuitBreaker,
  evaluateMaintenanceCircuitBreaker,
  evaluateCircuitBreakers
};
