/**
 * メール送信サービス
 */

const nodemailer = require('nodemailer');

// Nodemailerトランスポーターの設定
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * メール送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} subject - 件名
 * @param {string} html - HTML本文
 * @param {string} text - テキスト本文（オプション）
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    // SMTP設定が不完全な場合はエラーを投げる
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP設定が完了していません。.envファイルにSMTP設定を追加してください。');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // HTMLタグを除去したテキスト版
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw new Error('メールの送信に失敗しました');
  }
};

/**
 * パスワードリセットメールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} resetToken - パスワードリセットトークン
 * @param {string} userName - ユーザー名
 */
const sendPasswordResetEmail = async (to, resetToken, userName = 'ユーザー') => {
  // フロントエンドのURL（環境変数から取得、デフォルトはlocalhost）
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = 'KAJISHIFT - パスワードリセット';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${userName} 様</p>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          <p>以下のリンクをクリックして、新しいパスワードを設定してください。</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">パスワードをリセット</a>
          </p>
          <p>または、以下のURLをブラウザにコピー＆ペーストしてください：</p>
          <p style="word-break: break-all; background-color: #fff; padding: 10px; border-radius: 3px;">
            ${resetUrl}
          </p>
          <p><strong>このリンクは24時間有効です。</strong></p>
          <p>このリクエストをしていない場合は、このメールを無視してください。</p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * 予約確認メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} userName - ユーザー名
 * @param {object} bookingData - 予約データ
 */
const sendBookingConfirmationEmail = async (to, userName, bookingData) => {
  const { serviceType, scheduledDate, startTime, duration, address, workerName } = bookingData;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const bookingUrl = `${frontendUrl}/bookings/${bookingData.id}`;

  const subject = 'KAJISHIFT - 予約が確定しました';
  const scheduledDateStr = new Date(scheduledDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .info-box {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid #4CAF50;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${userName} 様</p>
          <p>予約が確定いたしました。以下の内容をご確認ください。</p>
          
          <div class="info-box">
            <h3>予約詳細</h3>
            <p><strong>サービス種類:</strong> ${serviceType}</p>
            <p><strong>予約日時:</strong> ${scheduledDateStr} ${startTime}</p>
            <p><strong>時間数:</strong> ${duration}時間</p>
            ${workerName ? `<p><strong>ワーカー:</strong> ${workerName}さん</p>` : ''}
            <p><strong>住所:</strong> ${address}</p>
          </div>

          <p style="text-align: center;">
            <a href="${bookingUrl}" class="button">予約詳細を確認</a>
          </p>

          <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * 予約変更通知メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} userName - ユーザー名
 * @param {object} bookingData - 予約データ
 * @param {string} changeType - 変更タイプ（STATUS, DATE, DETAILS）
 */
const sendBookingUpdateEmail = async (to, userName, bookingData, changeType = 'DETAILS') => {
  const { serviceType, scheduledDate, startTime, duration, address, status, bookingId } = bookingData;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const bookingUrl = `${frontendUrl}/bookings/${bookingId}`;

  const statusMessages = {
    'PENDING': '保留中',
    'CONFIRMED': '確定',
    'IN_PROGRESS': '作業中',
    'COMPLETED': '完了',
    'CANCELLED': 'キャンセル'
  };

  const subject = 'KAJISHIFT - 予約情報が更新されました';
  const scheduledDateStr = new Date(scheduledDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  let changeMessage = '';
  if (changeType === 'STATUS') {
    changeMessage = `<p><strong>ステータスが変更されました:</strong> ${statusMessages[status] || status}</p>`;
  } else if (changeType === 'DATE') {
    changeMessage = `<p><strong>予約日時が変更されました:</strong> ${scheduledDateStr} ${startTime}</p>`;
  } else {
    changeMessage = '<p>予約情報が更新されました。詳細をご確認ください。</p>';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #2196F3;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .info-box {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid #2196F3;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #2196F3;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${userName} 様</p>
          ${changeMessage}
          
          <div class="info-box">
            <h3>予約詳細</h3>
            <p><strong>サービス種類:</strong> ${serviceType}</p>
            <p><strong>予約日時:</strong> ${scheduledDateStr} ${startTime}</p>
            <p><strong>時間数:</strong> ${duration}時間</p>
            <p><strong>住所:</strong> ${address}</p>
            <p><strong>ステータス:</strong> ${statusMessages[status] || status}</p>
          </div>

          <p style="text-align: center;">
            <a href="${bookingUrl}" class="button">予約詳細を確認</a>
          </p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * レビュー通知メールを送信
 * @param {string} to - 送信先メールアドレス（ワーカー）
 * @param {string} workerName - ワーカー名
 * @param {object} reviewData - レビューデータ
 */
const sendReviewNotificationEmail = async (to, workerName, reviewData) => {
  const { rating, comment, reviewerName, serviceType } = reviewData;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const reviewUrl = `${frontendUrl}/reviews`;

  const subject = 'KAJISHIFT - 新しいレビューが投稿されました';
  const stars = '⭐'.repeat(rating);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #FF9800;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .review-box {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid #FF9800;
        }
        .rating {
          font-size: 24px;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #FF9800;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${workerName} 様</p>
          <p>${reviewerName}さんから新しいレビューが投稿されました。</p>
          
          <div class="review-box">
            <h3>レビュー内容</h3>
            <p><strong>サービス:</strong> ${serviceType}</p>
            <p><strong>評価:</strong> <span class="rating">${stars}</span> (${rating}/5)</p>
            ${comment ? `<p><strong>コメント:</strong><br>${comment}</p>` : ''}
          </div>

          <p style="text-align: center;">
            <a href="${reviewUrl}" class="button">レビューを確認</a>
          </p>

          <p>引き続きよろしくお願いいたします。</p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * 決済完了通知メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} userName - ユーザー名
 * @param {object} paymentData - 決済データ
 */
const sendPaymentConfirmationEmail = async (to, userName, paymentData) => {
  const { amount, bookingId, serviceType, paymentDate } = paymentData;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const paymentUrl = `${frontendUrl}/payments`;

  const subject = 'KAJISHIFT - 決済が完了しました';
  const paymentDateStr = new Date(paymentDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #9C27B0;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .info-box {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid #9C27B0;
        }
        .amount {
          font-size: 28px;
          font-weight: bold;
          color: #9C27B0;
          margin: 10px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #9C27B0;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${userName} 様</p>
          <p>決済が正常に完了いたしました。ご利用ありがとうございます。</p>
          
          <div class="info-box">
            <h3>決済詳細</h3>
            <p><strong>サービス:</strong> ${serviceType}</p>
            <p><strong>決済日:</strong> ${paymentDateStr}</p>
            <p class="amount">¥${amount.toLocaleString()}</p>
          </div>

          <p style="text-align: center;">
            <a href="${paymentUrl}" class="button">決済履歴を確認</a>
          </p>

          <p>領収書が必要な場合は、お問い合わせフォームよりご連絡ください。</p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * ワーカー承認通知メールを送信
 * @param {string} to - 送信先メールアドレス（ワーカー）
 * @param {string} workerName - ワーカー名
 * @param {string} approvalStatus - 承認ステータス（APPROVED, REJECTED）
 */
const sendWorkerApprovalEmail = async (to, workerName, approvalStatus) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const profileUrl = `${frontendUrl}/workers/me`;

  let subject, headerColor, message, buttonText;
  if (approvalStatus === 'APPROVED') {
    subject = 'KAJISHIFT - ワーカー登録が承認されました';
    headerColor = '#4CAF50';
    message = `
      <p>おめでとうございます！ワーカー登録が承認されました。</p>
      <p>これから予約を受け付けることができます。プロフィールを充実させて、より多くのお客様に選ばれるワーカーを目指しましょう。</p>
    `;
    buttonText = 'プロフィールを確認';
  } else {
    subject = 'KAJISHIFT - ワーカー登録について';
    headerColor = '#F44336';
    message = `
      <p>申し訳ございませんが、ワーカー登録の申請が承認されませんでした。</p>
      <p>詳細については、サポートまでお問い合わせください。</p>
    `;
    buttonText = 'サポートに問い合わせ';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${headerColor};
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: ${headerColor};
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${workerName} 様</p>
          ${message}
          <p style="text-align: center;">
            <a href="${profileUrl}" class="button">${buttonText}</a>
          </p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

/**
 * システム通知メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} userName - ユーザー名
 * @param {object} notificationData - 通知データ
 */
const sendSystemNotificationEmail = async (to, userName, notificationData) => {
  const { title, content, priority = 'normal' } = notificationData;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
  const notificationUrl = `${frontendUrl}/notifications`;

  // 優先度に応じた色とアイコン
  const priorityConfig = {
    high: {
      color: '#F44336',
      icon: '🔴',
      label: '重要'
    },
    normal: {
      color: '#2196F3',
      icon: 'ℹ️',
      label: 'お知らせ'
    },
    low: {
      color: '#4CAF50',
      icon: '📢',
      label: 'ご案内'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.normal;
  const subject = `KAJISHIFT - ${title}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: ${config.color};
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .priority-badge {
          display: inline-block;
          background-color: ${config.color};
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          margin-bottom: 15px;
        }
        .notification-box {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 4px solid ${config.color};
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: ${config.color};
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 20px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.icon} KAJISHIFT</h1>
        </div>
        <div class="content">
          <p>${userName} 様</p>
          <span class="priority-badge">${config.label}</span>
          <div class="notification-box">
            <h2>${title}</h2>
            <div style="white-space: pre-wrap;">${content}</div>
          </div>
          <p style="text-align: center;">
            <a href="${notificationUrl}" class="button">通知を確認</a>
          </p>
          <p>ご不明な点がございましたら、サポートまでお問い合わせください。</p>
        </div>
        <div class="footer">
          <p>このメールは自動送信されています。返信はできません。</p>
          <p>&copy; 2026 KAJISHIFT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingUpdateEmail,
  sendReviewNotificationEmail,
  sendPaymentConfirmationEmail,
  sendWorkerApprovalEmail,
  sendSystemNotificationEmail
};
