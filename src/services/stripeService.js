/**
 * Stripe連携サービス（β版はテストモードのみ）
 */

const Stripe = require('stripe');
const prisma = require('../config/database');

let stripeClient = null;

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEYが設定されていません');
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('β版ではStripeテストキーのみ使用できます');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20'
    });
  }

  return stripeClient;
};

const getOrCreateCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id,
      environment: process.env.NODE_ENV || 'development'
    }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  });

  return customer.id;
};

const createPaymentIntent = async ({ amount, customerId, bookingId, userId, paymentId }) => {
  const stripe = getStripe();

  return stripe.paymentIntents.create({
    amount,
    currency: 'jpy',
    customer: customerId,
    metadata: {
      bookingId,
      userId,
      paymentId,
      environment: process.env.NODE_ENV || 'development'
    },
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never'
    }
  });
};

const createSetupIntent = async (customerId) => {
  const stripe = getStripe();

  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card']
  });
};

const retrievePaymentMethod = async (paymentMethodId) => {
  return getStripe().paymentMethods.retrieve(paymentMethodId);
};

const detachPaymentMethod = async (paymentMethodId) => {
  return getStripe().paymentMethods.detach(paymentMethodId);
};

const constructWebhookEvent = (rawBody, signature) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRETが設定されていません');
  }

  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

module.exports = {
  getStripe,
  getOrCreateCustomer,
  createPaymentIntent,
  createSetupIntent,
  retrievePaymentMethod,
  detachPaymentMethod,
  constructWebhookEvent
};
