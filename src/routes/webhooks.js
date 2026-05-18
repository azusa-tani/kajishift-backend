/**
 * 外部サービスWebhookルート
 */

const express = require('express');
const router = express.Router();
const stripeWebhookController = require('../controllers/stripeWebhookController');

router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookController.handleStripeWebhook
);

module.exports = router;
