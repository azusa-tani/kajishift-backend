/**
 * バリデーション関数
 */

/**
 * メールアドレスのバリデーション
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * パスワードのバリデーション
 * - 8文字以上
 * - 英数字を含む
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'パスワードは8文字以上である必要があります' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'パスワードには英字を含める必要があります' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'パスワードには数字を含める必要があります' };
  }
  return { valid: true };
};

/**
 * 電話番号のバリデーション（日本の電話番号形式）
 */
const validatePhone = (phone) => {
  const phoneRegex = /^0\d{1,4}-\d{1,4}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * 必須フィールドのチェック
 */
const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, message: `${fieldName}は必須です` };
  }
  return { valid: true };
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired
};
