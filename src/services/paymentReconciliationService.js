const prisma = require('../config/database');
const logger = require('../config/logger');
const stripeService = require('./stripeService');
const opsAutoPauseService = require('./opsAutoPauseService');

const DEFAULT_PENDING_TTL_MINUTES = Number(process.env.OPS_PENDING_PAYMENT_TTL_MINUTES || 30);

const pendingCutoff = (ttlMinutes = DEFAULT_PENDING_TTL_MINUTES) => {
  return new Date(Date.now() - ttlMinutes * 60 * 1000);
};

const recordAnomaly = async ({ payment, type, message, metadata = {} }) => {
  await opsAutoPauseService.recordOpsEvent({
    type,
    severity: 'critical',
    source: 'payment_reconciliation',
    fingerprint: `${type}:${payment.id}`,
    paymentId: payment.id,
    message,
    metadata: {
      bookingId: payment.bookingId,
      transactionId: payment.transactionId,
      ...metadata
    }
  });
};

const getStripeMetadata = (intent) => intent.metadata || {};

const collectIntentAnomalies = (payment, intent) => {
  const anomalies = [];

  if (intent.amount !== payment.amount) {
    anomalies.push({
      type: 'payment_amount_mismatch',
      message: `Payment金額とStripe PaymentIntent金額が一致しません: payment=${payment.amount}, stripe=${intent.amount}`,
      metadata: { paymentAmount: payment.amount, stripeAmount: intent.amount }
    });
  }

  if (intent.currency && intent.currency.toLowerCase() !== 'jpy') {
    anomalies.push({
      type: 'payment_metadata_mismatch',
      message: `Stripe PaymentIntent通貨がjpyではありません: ${intent.currency}`,
      metadata: { currency: intent.currency }
    });
  }

  if (intent.metadata && intent.metadata.bookingId && intent.metadata.bookingId !== payment.bookingId) {
    anomalies.push({
      type: 'payment_metadata_mismatch',
      message: 'PaymentのbookingIdとStripe metadata.bookingIdが一致しません',
      metadata: { stripeBookingId: intent.metadata.bookingId }
    });
  }

  if (intent.metadata && intent.metadata.userId && intent.metadata.userId !== payment.userId) {
    anomalies.push({
      type: 'payment_metadata_mismatch',
      message: 'PaymentのuserIdとStripe metadata.userIdが一致しません',
      metadata: { stripeUserId: intent.metadata.userId }
    });
  }

  if (intent.metadata && intent.metadata.paymentId && intent.metadata.paymentId !== payment.id) {
    anomalies.push({
      type: 'payment_metadata_mismatch',
      message: 'Payment.idとStripe metadata.paymentIdが一致しません',
      metadata: { stripePaymentId: intent.metadata.paymentId }
    });
  }

  return anomalies;
};

const validateIntentAgainstPayment = async (payment, intent) => {
  const anomalies = collectIntentAnomalies(payment, intent);

  for (const anomaly of anomalies) {
    await recordAnomaly({ payment, ...anomaly });
  }

  return anomalies;
};

const syncPaymentFromIntent = async (payment, intent) => {
  const data = {
    stripeStatus: intent.status,
    lastSyncedAt: new Date()
  };

  if (intent.status === 'succeeded' && payment.status !== 'COMPLETED') {
    data.status = 'COMPLETED';
    data.paymentMethod = 'stripe';
  } else if (['payment_failed', 'requires_payment_method', 'canceled'].includes(intent.status) && payment.status !== 'FAILED') {
    data.status = 'FAILED';
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data
  });
};

const validateStripeEventProcessing = async (payment, intent) => {
  const terminalStatuses = ['succeeded', 'payment_failed', 'canceled'];
  if (!terminalStatuses.includes(intent.status)) {
    return [];
  }

  const stripeEvent = await prisma.stripeEvent.findFirst({
    where: {
      paymentId: payment.id,
      type: {
        in: ['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled']
      }
    },
    orderBy: { processedAt: 'desc' }
  });

  if (!stripeEvent) {
    await recordAnomaly({
      payment,
      type: 'stripe_event_processing_missing',
      message: '終端状態のPaymentIntentに対応する処理済みStripeEventが見つかりません。',
      metadata: { paymentIntentId: intent.id, stripeStatus: intent.status }
    });
    return ['stripe_event_processing_missing'];
  }

  if (stripeEvent.status !== 'processed') {
    await recordAnomaly({
      payment,
      type: 'stripe_event_processing_failed',
      message: 'PaymentIntentに対応するStripeEventがprocessedではありません。',
      metadata: {
        paymentIntentId: intent.id,
        stripeEventId: stripeEvent.id,
        stripeEventStatus: stripeEvent.status,
        errorMessage: stripeEvent.errorMessage || null
      }
    });
    return ['stripe_event_processing_failed'];
  }

  return [];
};

const findStuckPendingPayments = async (ttlMinutes = DEFAULT_PENDING_TTL_MINUTES) => {
  return prisma.payment.findMany({
    where: {
      status: 'PENDING',
      transactionId: { not: null },
      updatedAt: { lt: pendingCutoff(ttlMinutes) }
    },
    orderBy: { updatedAt: 'asc' },
    take: Number(process.env.OPS_RECONCILIATION_BATCH_SIZE || 20)
  });
};

const reconcilePayment = async (payment) => {
  if (!payment.transactionId) {
    return { paymentId: payment.id, skipped: true, reason: 'missing_transaction_id' };
  }

  let intent;
  try {
    intent = await stripeService.retrievePaymentIntent(payment.transactionId);
  } catch (error) {
    await recordAnomaly({
      payment,
      type: 'payment_reconciliation_anomaly',
      message: `Stripe PaymentIntent取得に失敗しました: ${error.message}`,
      metadata: { error: error.message }
    });
    throw error;
  }

  const anomalies = await validateIntentAgainstPayment(payment, intent);
  const stripeEventAnomalies = await validateStripeEventProcessing(payment, intent);
  const totalAnomalies = anomalies.length + stripeEventAnomalies.length;

  if (totalAnomalies > 0) {
    await opsAutoPauseService.evaluatePaymentCircuitBreaker();
    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      stripeStatus: intent.status,
      dbStatus: payment.status,
      anomalies: totalAnomalies,
      autoHealed: false
    };
  }

  const syncedPayment = await syncPaymentFromIntent(payment, intent);

  if (payment.status === 'PENDING' && intent.status === 'succeeded') {
    await opsAutoPauseService.recordOpsEvent({
      type: 'payment_reconciliation_auto_healed',
      severity: 'warning',
      source: 'payment_reconciliation',
      fingerprint: `payment_reconciliation_auto_healed:${payment.id}`,
      paymentId: payment.id,
      message: 'Stripeでは成功済みのPaymentをDB側COMPLETEDへ自動補正しました。',
      metadata: {
        bookingId: payment.bookingId,
        transactionId: payment.transactionId
      }
    });
  }

  return {
    paymentId: payment.id,
    transactionId: payment.transactionId,
    stripeStatus: intent.status,
    dbStatus: syncedPayment.status,
    anomalies: totalAnomalies,
    autoHealed: syncedPayment.status !== payment.status
  };
};

const findRecentStripeIntentOrphans = async () => {
  if (process.env.OPS_RECONCILE_STRIPE_ORPHANS === 'false') {
    return [];
  }

  const lookbackMinutes = Number(process.env.OPS_STRIPE_ORPHAN_LOOKBACK_MINUTES || 60);
  const createdAfter = new Date(Date.now() - lookbackMinutes * 60 * 1000);
  const intents = await stripeService.listRecentPaymentIntents({
    createdAfter,
    limit: Number(process.env.OPS_STRIPE_ORPHAN_BATCH_SIZE || 50)
  });

  const anomalies = [];
  for (const intent of intents.data || []) {
    const metadata = getStripeMetadata(intent);
    if (metadata.environment && metadata.environment !== (process.env.NODE_ENV || 'development')) {
      continue;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: intent.id },
          ...(metadata.paymentId ? [{ id: metadata.paymentId }] : []),
          ...(metadata.bookingId ? [{ bookingId: metadata.bookingId }] : [])
        ]
      }
    });

    if (payment) {
      continue;
    }

    await opsAutoPauseService.recordOpsEvent({
      type: 'payment_reconciliation_anomaly',
      severity: 'critical',
      source: 'payment_reconciliation',
      fingerprint: `stripe_intent_without_payment:${intent.id}`,
      message: 'Stripe側にPaymentIntentがありますが、DB Paymentが見つかりません。',
      metadata: {
        paymentIntentId: intent.id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
        metadata
      }
    });
    anomalies.push({ paymentIntentId: intent.id, type: 'stripe_intent_without_payment' });
  }

  return anomalies;
};

const runPaymentReconciliation = async () => {
  const payments = await findStuckPendingPayments();
  const results = [];

  for (const payment of payments) {
    try {
      results.push(await reconcilePayment(payment));
    } catch (error) {
      logger.error('Payment reconciliation failed', {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        error: error.message
      });
    }
  }

  let stripeOrphans = [];
  try {
    stripeOrphans = await findRecentStripeIntentOrphans();
  } catch (error) {
    logger.error('Stripe orphan PaymentIntent reconciliation failed', { error: error.message });
    await opsAutoPauseService.recordOpsEvent({
      type: 'payment_reconciliation_anomaly',
      severity: 'critical',
      source: 'payment_reconciliation',
      fingerprint: 'stripe_orphan_scan_failed',
      message: `Stripe PaymentIntent孤立チェックに失敗しました: ${error.message}`,
      metadata: { error: error.message }
    }).catch(() => {});
  }

  await opsAutoPauseService.evaluatePaymentCircuitBreaker();

  return {
    checked: payments.length,
    stripeOrphans: stripeOrphans.length,
    results
  };
};

module.exports = {
  findStuckPendingPayments,
  findRecentStripeIntentOrphans,
  collectIntentAnomalies,
  validateIntentAgainstPayment,
  reconcilePayment,
  runPaymentReconciliation
};
