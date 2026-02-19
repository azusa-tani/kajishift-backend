/**
 * JWT認証ミドルウェア
 */

const jwt = require('jsonwebtoken');

/**
 * JWTトークンを検証するミドルウェア
 */
const authenticate = (req, res, next) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: '認証トークンが必要です'
      });
    }

    const token = authHeader.substring(7); // "Bearer " を除去
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: '認証トークンが無効です'
      });
    }

    // トークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Authentication Error',
        message: 'トークンの有効期限が切れています'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Authentication Error',
        message: '無効なトークンです'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: '認証処理中にエラーが発生しました'
    });
  }
};

/**
 * 特定のロールのみアクセスを許可するミドルウェア
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: '認証が必要です'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Authorization Error',
        message: 'この操作を実行する権限がありません'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
