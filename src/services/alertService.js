const logger = require('../config/logger');
const prisma = require('../config/database');

const OPS_DASHBOARD_URL = process.env.OPS_DASHBOARD_URL || '/api/admin/ops/status';
const PUBLIC_STATUS_URL = process.env.PUBLIC_STATUS_URL || '/api/public/status';

const getAlertTargets = () => {
  const urls = (process.env.OPS_ALERT_WEBHOOK_URLS || process.env.OPS_ALERT_WEBHOOK_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  return urls;
};

const redactTarget = (url) => {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch (error) {
    return 'invalid-url';
  }
};

const buildProviderPayload = (url, payload) => {
  const lowerUrl = String(url || '').toLowerCase();
  if (lowerUrl.includes('discord')) {
    return {
      username: 'KAJISHIFT Ops',
      embeds: [{
        title: payload.title,
        description: payload.message,
        fields: [
          { name: 'severity', value: payload.severity, inline: true },
          { name: 'environment', value: payload.environment, inline: true },
          { name: 'mode', value: payload.currentMode || 'unknown', inline: true },
          { name: 'impact', value: payload.impact || '未設定', inline: false },
          { name: 'checkUrls', value: payload.checkUrls.join('\n'), inline: false }
        ],
        timestamp: payload.timestamp
      }]
    };
  }

  if (lowerUrl.includes('slack')) {
    return {
      text: `${payload.title} (${payload.severity})`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: payload.title } },
        { type: 'section', text: { type: 'mrkdwn', text: payload.message } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*severity*\n${payload.severity}` },
            { type: 'mrkdwn', text: `*environment*\n${payload.environment}` },
            { type: 'mrkdwn', text: `*mode*\n${payload.currentMode || 'unknown'}` },
            { type: 'mrkdwn', text: `*time*\n${payload.timestamp}` }
          ]
        },
        { type: 'section', text: { type: 'mrkdwn', text: `*impact*\n${payload.impact || '未設定'}` } },
        { type: 'section', text: { type: 'mrkdwn', text: `*check URLs*\n${payload.checkUrls.join('\n')}` } }
      ]
    };
  }

  return payload;
};

const postWebhook = async (url, payload) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildProviderPayload(url, payload))
  });

  if (!response.ok) {
    throw new Error(`alert webhook failed: ${response.status}`);
  }
};

const recordAlertEvent = async ({ type, severity, message, metadata }) => {
  try {
    await prisma.opsEvent.create({
      data: {
        type,
        severity,
        source: 'alert_service',
        fingerprint: `${type}:${metadata && metadata.title ? metadata.title : 'ops-alert'}`,
        message,
        metadata
      }
    });
  } catch (error) {
    logger.error('Failed to record alert ops event', { error: error.message, type });
  }
};

const sendOpsAlert = async ({
  title,
  severity = 'warning',
  message,
  currentMode = null,
  reason = null,
  impact = null,
  checkUrls = [],
  recoveryHints = [],
  details = {}
}) => {
  const targets = getAlertTargets();
  const configuredCheckUrls = [
    PUBLIC_STATUS_URL,
    OPS_DASHBOARD_URL,
    process.env.STRIPE_DASHBOARD_URL || 'https://dashboard.stripe.com/test/events',
    ...checkUrls
  ].filter(Boolean);
  const payload = {
    title,
    severity,
    message: message || reason || title,
    service: 'kajishift-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    currentMode,
    reason,
    impact,
    checkUrls: configuredCheckUrls,
    recoveryHints,
    details
  };

  if (targets.length === 0) {
    logger.warn('Ops alert target is not configured', payload);
    await recordAlertEvent({
      type: 'ops_alert_not_configured',
      severity: 'critical',
      message: 'OPS_ALERT_WEBHOOK_URLSが未設定のため、運用通知を送信できませんでした。',
      metadata: { title, configuredTargets: 0, payload }
    });
    return { sent: false, configuredTargets: 0 };
  }

  const results = await Promise.allSettled(targets.map((url) => postWebhook(url, payload)));
  const failures = results.filter((result) => result.status === 'rejected');

  if (failures.length > 0) {
    logger.error('Ops alert delivery failed', {
      title,
      failures: failures.map((failure) => failure.reason.message)
    });
    await recordAlertEvent({
      type: 'ops_alert_delivery_failed',
      severity: 'critical',
      message: '運用通知の一部または全ての送信に失敗しました。',
      metadata: {
        title,
        configuredTargets: targets.length,
        deliveredTargets: targets.length - failures.length,
        failedTargets: failures.length,
        targets: targets.map(redactTarget),
        failures: failures.map((failure) => failure.reason.message)
      }
    });
  }

  logger.warn('Ops alert emitted', {
    title,
    severity,
    targets: targets.length,
    delivered: targets.length - failures.length
  });

  return {
    sent: failures.length < targets.length,
    enoughChannels: targets.length >= 2 && failures.length <= targets.length - 2,
    configuredTargets: targets.length,
    deliveredTargets: targets.length - failures.length,
    failedTargets: failures.length
  };
};

module.exports = {
  getAlertTargets,
  sendOpsAlert
};
