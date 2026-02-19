/**
 * 環境変数のバリデーション
 */

/**
 * 必須環境変数のチェック
 */
const validateEnv = () => {
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
      console.warn(
        '⚠️  警告: JWT_SECRETは32文字以上に設定することを推奨します。'
      );
    }
  }

  // DATABASE_URLの形式チェック
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URLはPostgreSQLの接続URLである必要があります。');
  }

  console.log('✅ 環境変数のバリデーション完了');
};

module.exports = { validateEnv };
