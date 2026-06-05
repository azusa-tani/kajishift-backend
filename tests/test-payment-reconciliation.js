const assert = require('assert');
const { collectIntentAnomalies } = require('../src/services/paymentReconciliationService');

const payment = {
  id: 'pay_1',
  bookingId: 'booking_1',
  userId: 'user_1',
  amount: 5000
};

const matchingIntent = {
  id: 'pi_1',
  amount: 5000,
  currency: 'jpy',
  metadata: {
    paymentId: 'pay_1',
    bookingId: 'booking_1',
    userId: 'user_1'
  }
};

assert.deepEqual(collectIntentAnomalies(payment, matchingIntent), []);

const anomalyTypes = collectIntentAnomalies(payment, {
  ...matchingIntent,
  amount: 4900,
  currency: 'usd',
  metadata: {
    paymentId: 'pay_other',
    bookingId: 'booking_other',
    userId: 'user_other'
  }
}).map((anomaly) => anomaly.type);

assert(anomalyTypes.includes('payment_amount_mismatch'));
assert.equal(anomalyTypes.filter((type) => type === 'payment_metadata_mismatch').length, 4);

console.log('Payment reconciliation anomaly detection passed');
