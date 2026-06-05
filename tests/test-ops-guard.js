const assert = require('assert');
const { getEnvStatus } = require('../src/config/operationMode');

const originalMode = process.env.BETA_OPERATION_MODE;
const originalMessage = process.env.BETA_STOP_MESSAGE;
const originalResumeAt = process.env.BETA_RESUME_AT;

const withMode = (mode, fn) => {
  process.env.BETA_OPERATION_MODE = mode;
  delete process.env.BETA_STOP_MESSAGE;
  delete process.env.BETA_RESUME_AT;
  fn(getEnvStatus());
};

try {
  withMode('normal', (status) => {
    assert.equal(status.mode, 'normal');
    assert.equal(status.capabilities.canCreateBookings, true);
    assert.equal(status.capabilities.canCreatePaymentIntents, true);
  });

  withMode('booking_paused', (status) => {
    assert.equal(status.mode, 'booking_paused');
    assert.equal(status.capabilities.canCreateBookings, false);
    assert.equal(status.capabilities.canMutateBookings, true);
    assert.equal(status.capabilities.canCreatePaymentIntents, true);
  });

  withMode('payment_paused', (status) => {
    assert.equal(status.mode, 'payment_paused');
    assert.equal(status.capabilities.canCreateBookings, false);
    assert.equal(status.capabilities.canCreatePaymentIntents, false);
    assert.equal(status.capabilities.canCreateSetupIntents, false);
  });

  withMode('maintenance', (status) => {
    assert.equal(status.mode, 'maintenance');
    assert.equal(status.capabilities.canCreateBookings, false);
    assert.equal(status.capabilities.canMutateBookings, false);
    assert.equal(status.capabilities.canCreatePaymentIntents, false);
    assert.equal(status.capabilities.canCreateReviews, false);
    assert.equal(status.capabilities.canCreateSupportTickets, true);
    assert.equal(status.capabilities.canSendMessages, false);
    assert.equal(status.capabilities.canRegisterUsers, false);
    assert.equal(status.capabilities.canUploadFiles, false);
    assert.equal(status.capabilities.canWriteProfiles, false);
    assert.equal(status.capabilities.canWriteNotifications, false);
    assert.equal(status.currentMode, 'maintenance');
    assert.equal(status.operationLabel, 'メンテナンス');
  });

  process.env.BETA_OPERATION_MODE = 'booking_paused';
  process.env.BETA_STOP_MESSAGE = '一時停止テスト';
  process.env.BETA_RESUME_AT = '2026-05-19T18:00:00+09:00';
  const customStatus = getEnvStatus();
  assert.equal(customStatus.message, '一時停止テスト');
  assert.equal(customStatus.resumeAt, '2026-05-19T18:00:00+09:00');

  console.log('Ops guard mode matrix passed');
} finally {
  if (originalMode === undefined) {
    delete process.env.BETA_OPERATION_MODE;
  } else {
    process.env.BETA_OPERATION_MODE = originalMode;
  }

  if (originalMessage === undefined) {
    delete process.env.BETA_STOP_MESSAGE;
  } else {
    process.env.BETA_STOP_MESSAGE = originalMessage;
  }

  if (originalResumeAt === undefined) {
    delete process.env.BETA_RESUME_AT;
  } else {
    process.env.BETA_RESUME_AT = originalResumeAt;
  }
}
