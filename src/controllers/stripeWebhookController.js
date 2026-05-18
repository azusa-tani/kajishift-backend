/**
 * Stripe Webhookコントローラー
 */

const paymentService = require('../services/paymentService');
const stripeService = require('../services/stripeService');

const handleStripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripeService.constructWebhookEvent(req.body, signature);
    const result = await paymentService.handleStripeEvent(event);

    res.json(result);
  } catch (error) {
    error.status = error.status || 400;
    next(error);
  }
};

module.exports = {
  handleStripeWebhook
};
