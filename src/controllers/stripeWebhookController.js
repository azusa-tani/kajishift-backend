/**
 * Stripe Webhookコントローラー
 */

const paymentService = require('../services/paymentService');
const stripeService = require('../services/stripeService');
const logger = require('../config/logger');
const opsAutoPauseService = require('../services/opsAutoPauseService');

const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripeService.constructWebhookEvent(req.body, signature);
    const paymentIntentId = event.data && event.data.object ? event.data.object.id : null;

    logger.info('Stripe webhook received', {
      eventId: event.id,
      type: event.type,
      paymentIntentId
    });

    const result = await paymentService.handleStripeEvent(event);

    logger.info('Stripe webhook response ready', {
      eventId: event.id,
      type: event.type,
      paymentIntentId,
      duplicate: Boolean(result.duplicate),
      received: Boolean(result.received)
    });

    res.json(result);
  } catch (error) {
    logger.error('Stripe webhook failed', {
      message: error.message,
      type: error.type || null
    });
    await opsAutoPauseService.recordOpsEvent({
      type: 'stripe_webhook_failure',
      severity: 'critical',
      source: 'stripe_webhook',
      fingerprint: `stripe_webhook_failure:${error.type || 'unknown'}`,
      message: `Stripe Webhook処理に失敗しました: ${error.message}`,
      metadata: {
        stripeErrorType: error.type || null
      }
    }).catch((eventError) => {
      logger.error('Failed to record Stripe webhook failure ops event', {
        error: eventError.message
      });
    });
    await opsAutoPauseService.evaluatePaymentCircuitBreaker().catch((pauseError) => {
      logger.error('Failed to evaluate payment circuit breaker after webhook failure', {
        error: pauseError.message
      });
    });
    error.status = error.status || 400;
    next(error);
  }
};

module.exports = {
  handleStripeWebhook
};
