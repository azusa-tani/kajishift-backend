const prisma = require('./database');
const logger = require('./logger');

const OPERATION_SETTING_KEY = 'operation_mode';
const VALID_OPERATION_MODES = ['normal', 'booking_paused', 'payment_paused', 'maintenance'];

const MODE_LABELS = {
  normal: '通常稼働',
  booking_paused: '新規予約停止',
  payment_paused: '決済・新規予約停止',
  maintenance: 'メンテナンス'
};

const DEFAULT_MESSAGES = {
  normal: 'KAJISHIFTは通常稼働中です。',
  booking_paused: '現在、新規予約の受付を一時停止しています。既存予約の確認やチャットはご利用いただけます。',
  payment_paused: '現在、決済受付を一時停止しています。既存予約の確認や領収書の取得はご利用いただけます。',
  maintenance: '現在、β版のメンテナンス中です。復旧までしばらくお待ちください。'
};

const MODE_BLOCKS = {
  normal: [],
  booking_paused: ['createBooking'],
  payment_paused: ['createBooking', 'createPaymentIntent', 'createSetupIntent', 'cardWrite'],
  maintenance: [
    'registerUser',
    'createBooking',
    'bookingWrite',
    'createPaymentIntent',
    'createSetupIntent',
    'cardWrite',
    'createReview',
    'sendMessage',
    'uploadFile',
    'deleteFile',
    'favoriteWrite',
    'profileWrite',
    'notificationWrite',
    'workerAvailabilityWrite',
    'adminWrite'
  ]
};

const normalizeMode = (mode) => {
  const normalized = String(mode || 'normal').trim().toLowerCase();
  return VALID_OPERATION_MODES.includes(normalized) ? normalized : 'normal';
};

const buildStatus = (state = {}) => {
  const mode = normalizeMode(state.mode || process.env.BETA_OPERATION_MODE);
  const blockedOperations = MODE_BLOCKS[mode] || [];
  const reason = state.reason || process.env.BETA_STOP_REASON || null;
  const resumeAt = state.resumeAt || state.resumeAfter || process.env.BETA_RESUME_AT || null;
  const updatedAt = state.updatedAt || null;

  return {
    mode,
    currentMode: mode,
    operationLabel: MODE_LABELS[mode] || mode,
    isNormal: mode === 'normal',
    source: state.source || 'env',
    reason,
    trigger: state.trigger || null,
    severity: state.severity || (mode === 'normal' ? 'info' : 'warning'),
    message: state.message || process.env.BETA_STOP_MESSAGE || DEFAULT_MESSAGES[mode],
    resumeAt,
    resumeAfter: resumeAt,
    autoPausedAt: state.autoPausedAt || null,
    createdBy: state.createdBy || null,
    updatedAt,
    lastChangedAt: updatedAt,
    blockedOperations,
    capabilities: {
      canCreateBookings: !blockedOperations.includes('createBooking'),
      canMutateBookings: !blockedOperations.includes('bookingWrite'),
      canCreatePaymentIntents: !blockedOperations.includes('createPaymentIntent'),
      canCreateSetupIntents: !blockedOperations.includes('createSetupIntent'),
      canWriteCards: !blockedOperations.includes('cardWrite'),
      canCreateReviews: !blockedOperations.includes('createReview'),
      canCreateSupportTickets: !blockedOperations.includes('createSupportTicket'),
      canSendMessages: !blockedOperations.includes('sendMessage'),
      canUploadFiles: !blockedOperations.includes('uploadFile'),
      canDeleteFiles: !blockedOperations.includes('deleteFile'),
      canWriteFavorites: !blockedOperations.includes('favoriteWrite'),
      canWriteProfiles: !blockedOperations.includes('profileWrite'),
      canWriteNotifications: !blockedOperations.includes('notificationWrite'),
      canWriteWorkerAvailability: !blockedOperations.includes('workerAvailabilityWrite'),
      canAdminWrite: !blockedOperations.includes('adminWrite'),
      canRegisterUsers: !blockedOperations.includes('registerUser')
    }
  };
};

const getEnvStatus = () => buildStatus({ source: 'env' });

const parseStoredState = (setting) => {
  if (!setting || !setting.value) {
    return null;
  }

  if (typeof setting.value === 'object') {
    return setting.value;
  }

  try {
    return JSON.parse(setting.value);
  } catch (error) {
    logger.error('Failed to parse operation mode setting', { error: error.message });
    return null;
  }
};

const getStoredState = async () => {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: OPERATION_SETTING_KEY }
    });
    return parseStoredState(setting);
  } catch (error) {
    logger.error('Failed to read operation mode from DB', { error: error.message });
    return null;
  }
};

const getOperationStatus = async () => {
  if (process.env.BETA_OPERATION_MODE_OVERRIDE) {
    return buildStatus({
      mode: process.env.BETA_OPERATION_MODE_OVERRIDE,
      source: 'env_override',
      message: process.env.BETA_STOP_MESSAGE,
      resumeAt: process.env.BETA_RESUME_AT,
      reason: process.env.BETA_STOP_REASON || 'environment override'
    });
  }

  const storedState = await getStoredState();
  if (storedState && normalizeMode(storedState.mode) !== 'normal') {
    return buildStatus({
      ...storedState,
      source: storedState.source || 'db'
    });
  }

  if (storedState && normalizeMode(storedState.mode) === 'normal') {
    return buildStatus({
      ...storedState,
      source: storedState.source || 'db'
    });
  }

  return getEnvStatus();
};

const setOperationMode = async ({
  mode,
  reason,
  trigger = 'manual',
  severity = 'warning',
  message,
  resumeAt = null,
  createdBy = null,
  metadata = {},
  source = 'db'
}) => {
  const normalizedMode = normalizeMode(mode);
  const now = new Date();
  const value = {
    mode: normalizedMode,
    reason: reason || DEFAULT_MESSAGES[normalizedMode],
    trigger,
    severity,
    message: message || DEFAULT_MESSAGES[normalizedMode],
    resumeAt,
    resumeAfter: resumeAt,
    autoPausedAt: trigger.startsWith('auto') && normalizedMode !== 'normal' ? now.toISOString() : null,
    createdBy,
    source,
    metadata,
    updatedAt: now.toISOString()
  };

  await prisma.$transaction([
    prisma.systemSettings.upsert({
      where: { key: OPERATION_SETTING_KEY },
      update: { value: JSON.stringify(value) },
      create: {
        key: OPERATION_SETTING_KEY,
        value: JSON.stringify(value),
        category: 'ops',
        description: 'Current public operation mode for automatic pause and recovery'
      }
    }),
    prisma.opsIncident.create({
      data: {
        mode: normalizedMode,
        reason: value.reason,
        trigger,
        severity,
        status: normalizedMode === 'normal' ? 'RESOLVED' : 'OPEN',
        autoPausedAt: trigger.startsWith('auto') && normalizedMode !== 'normal' ? now : null,
        resolvedAt: normalizedMode === 'normal' ? now : null,
        createdBy,
        metadata
      }
    })
  ]);

  logger.warn('Operation mode changed', {
    mode: normalizedMode,
    trigger,
    severity,
    reason: value.reason
  });

  return buildStatus(value);
};

const isOperationBlocked = async (operation) => {
  const status = await getOperationStatus();
  return status.blockedOperations.includes(operation);
};

module.exports = {
  OPERATION_SETTING_KEY,
  VALID_OPERATION_MODES,
  MODE_BLOCKS,
  MODE_LABELS,
  DEFAULT_MESSAGES,
  getEnvStatus,
  getOperationStatus,
  setOperationMode,
  isOperationBlocked
};
