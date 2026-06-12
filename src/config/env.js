/**
 * 環境変数のバリデーション
 */

/**
 * 必須環境変数のチェック
 */
const validateEnv = () => {
  const { VALID_OPERATION_MODES } = require('./operationMode');
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];

  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(
      `以下の必須環境変数が設定されていません: ${missingVars.join(', ')}\n` +
      '`.env`ファイルを確認してください。'
    );
  }

  // JWT_SECRETの強度チェック（本番環境のみ）
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('本番環境ではJWT_SECRETを32文字以上に設定してください。');
    }
  }

  // DATABASE_URLの形式チェック
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URLはPostgreSQLの接続URLである必要があります。');
  }

  const operationMode = String(process.env.BETA_OPERATION_MODE || 'normal').toLowerCase();
  if (!VALID_OPERATION_MODES.includes(operationMode)) {
    throw new Error(`BETA_OPERATION_MODEは次のいずれかにしてください: ${VALID_OPERATION_MODES.join(', ')}`);
  }

  if (process.env.BETA_RESUME_AT && Number.isNaN(Date.parse(process.env.BETA_RESUME_AT))) {
    throw new Error('BETA_RESUME_ATはISO 8601形式などDateとして解釈できる値にしてください。');
  }

  const stripeEnabled = String(process.env.ENABLE_STRIPE_PAYMENTS || '').toLowerCase() === 'true';
  if (stripeEnabled) {
    const stripeRequiredVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'];
    const missingStripeVars = stripeRequiredVars.filter((varName) => !process.env[varName]);

    if (missingStripeVars.length > 0) {
      throw new Error(`Stripe決済に必要な環境変数が設定されていません: ${missingStripeVars.join(', ')}`);
    }

    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      throw new Error('β版ではStripeのテストシークレットキー（sk_test_）のみ使用できます。');
    }

    if (!process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
      throw new Error('β版ではStripeのテスト公開キー（pk_test_）のみ使用できます。');
    }
  }

  const aiWorkerTestReviewEnabled = String(process.env.ENABLE_AI_WORKER_TEST_REVIEW || '').toLowerCase() === 'true';
  if (aiWorkerTestReviewEnabled && !process.env.OPENAI_API_KEY) {
    throw new Error('ワーカーテストAI一次判定を有効にする場合はOPENAI_API_KEYを設定してください。');
  }

  console.log('✅ 環境変数のバリデーション完了');
};

module.exports = { validateEnv };
