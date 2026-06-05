const prisma = require('../config/database');
const logger = require('../config/logger');
const paymentReconciliationService = require('../services/paymentReconciliationService');
const opsAutoPauseService = require('../services/opsAutoPauseService');
const alertService = require('../services/alertService');

const DEFAULT_INTERVAL_MS = Number(process.env.OPS_MONITOR_INTERVAL_MS || 5 * 60 * 1000);

let monitorTimer = null;

const runDbHealthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    await opsAutoPauseService.recordOpsEvent({
      type: 'db_health_failure',
      severity: 'critical',
      source: 'ops_monitor',
      fingerprint: 'db_health_failure',
      message: `DBヘルスチェックに失敗しました: ${error.message}`,
      metadata: { error: error.message }
    }).catch(async (eventError) => {
      logger.error('Failed to record DB health failure ops event', {
        error: eventError.message,
        originalError: error.message
      });
      await alertService.sendOpsAlert({
        title: 'KAJISHIFT DB health check failed',
        severity: 'critical',
        message: 'DB接続失敗を検知しました。DB停止中はDB永続モードへ自動切替できないため、外部監視またはRailway環境変数で BETA_OPERATION_MODE_OVERRIDE=maintenance を設定してください。',
        currentMode: process.env.BETA_OPERATION_MODE_OVERRIDE || 'unknown',
        reason: error.message,
        impact: 'DBを利用するAPIと自動停止証跡の記録が失敗している可能性があります。',
        recoveryHints: [
          'Railway PostgreSQL と接続数を確認してください。',
          'BETA_OPERATION_MODE_OVERRIDE=maintenance で即時停止してください。',
          'DB復旧後に /api/admin/ops/evaluate-breakers を実行してください。'
        ],
        details: { dbError: error.message, eventRecordError: eventError.message }
      });
    });
    await opsAutoPauseService.evaluateMaintenanceCircuitBreaker().catch((pauseError) => {
      logger.error('Failed to evaluate DB circuit breaker', { error: pauseError.message });
    });
    return { ok: false, error: error.message };
  }
};

const runOpsMonitorOnce = async () => {
  const db = await runDbHealthCheck();
  const reconciliation = db.ok
    ? await paymentReconciliationService.runPaymentReconciliation()
    : { skipped: true, reason: 'db_unavailable' };
  const breakers = db.ok
    ? await opsAutoPauseService.evaluateCircuitBreakers()
    : { skipped: true, reason: 'db_unavailable' };

  logger.info('Ops monitor completed', {
    db,
    reconciliation,
    breakers
  });

  return { db, reconciliation, breakers };
};

const startOpsMonitorJob = () => {
  if (process.env.ENABLE_OPS_MONITOR_JOB === 'false') {
    logger.info('Ops monitor job disabled by ENABLE_OPS_MONITOR_JOB=false');
    return null;
  }

  if (monitorTimer) {
    return monitorTimer;
  }

  monitorTimer = setInterval(() => {
    runOpsMonitorOnce().catch((error) => {
      logger.error('Ops monitor failed', { error: error.message, stack: error.stack });
    });
  }, DEFAULT_INTERVAL_MS);

  monitorTimer.unref();
  logger.info('Ops monitor job started', { intervalMs: DEFAULT_INTERVAL_MS });
  setTimeout(() => {
    runOpsMonitorOnce().catch((error) => {
      logger.error('Initial ops monitor failed', { error: error.message, stack: error.stack });
    });
  }, 0).unref();
  return monitorTimer;
};

module.exports = {
  runDbHealthCheck,
  runOpsMonitorOnce,
  startOpsMonitorJob
};
