/**
 * 領収書生成サービス
 */

const PDFDocument = require('pdfkit');
const prisma = require('../config/database');

/**
 * 領収書PDFを生成
 * @param {string} paymentId - 決済ID
 * @param {string} userId - ユーザーID（権限チェック用）
 * @returns {Promise<Buffer>} PDFバッファ
 */
const generateReceiptPDF = async (paymentId, userId) => {
  // 決済情報を取得
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              address: true
            }
          },
          worker: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true
        }
      }
    }
  });

  if (!payment) {
    throw new Error('決済が見つかりません');
  }

  // 権限チェック：顧客のみ自分の決済の領収書を取得可能
  if (payment.userId !== userId) {
    throw new Error('この決済の領収書を取得する権限がありません');
  }

  // 決済が完了していない場合はエラー
  if (payment.status !== 'COMPLETED') {
    throw new Error('完了していない決済の領収書は発行できません');
  }

  // PDFドキュメントを作成
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  // PDFバッファを収集
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {});

  // 領収書の内容を描画
  drawReceipt(doc, payment);

  // PDFを終了
  doc.end();

  // バッファを返す（非同期処理のため、Promiseでラップ）
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);
  });
};

/**
 * 領収書の内容を描画
 * @param {PDFDocument} doc - PDFドキュメント
 * @param {object} payment - 決済情報
 */
const drawReceipt = (doc, payment) => {
  const { booking, user } = payment;
  const paymentDate = new Date(payment.createdAt);
  const receiptNumber = `REC-${payment.id.substring(0, 8).toUpperCase()}`;

  // ヘッダー
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('領収書', 50, 50, { align: 'center' });

  // 発行日
  doc.fontSize(10)
     .font('Helvetica')
     .text(`発行日: ${paymentDate.toLocaleDateString('ja-JP', {
       year: 'numeric',
       month: 'long',
       day: 'numeric'
     })}`, 50, 100, { align: 'right' });

  // 領収書番号
  doc.text(`領収書番号: ${receiptNumber}`, 50, 115, { align: 'right' });

  // 宛先
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('宛先', 50, 150);
  
  doc.fontSize(11)
     .font('Helvetica')
     .text(user.name || 'お客様', 50, 170);
  
  if (user.address) {
    doc.text(user.address, 50, 190);
  }

  // 発行元
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('発行元', 350, 150);
  
  doc.fontSize(11)
     .font('Helvetica')
     .text('KAJISHIFT', 350, 170)
     .text('〒000-0000', 350, 190)
     .text('東京都渋谷区...', 350, 210);

  // 区切り線
  doc.moveTo(50, 250)
     .lineTo(550, 250)
     .stroke();

  // サービス内容
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('サービス内容', 50, 270);
  
  doc.fontSize(11)
     .font('Helvetica')
     .text(booking.serviceType || '家事代行サービス', 50, 290);

  // 日時
  if (booking.scheduledDate) {
    const scheduledDate = new Date(booking.scheduledDate);
    const dateStr = scheduledDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
    doc.text(`実施日: ${dateStr}`, 50, 310);
  }

  // ワーカー
  if (booking.worker) {
    doc.text(`ワーカー: ${booking.worker.name || '不明'}`, 50, 330);
  }

  // 金額
  doc.moveTo(50, 370)
     .lineTo(550, 370)
     .stroke();

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('金額', 50, 390);
  
  doc.fontSize(20)
     .text(`¥${payment.amount.toLocaleString()}`, 400, 390, { align: 'right' });

  // 支払い方法
  const paymentMethodMap = {
    'credit_card': 'クレジットカード',
    'bank_transfer': '銀行振込',
    'cash': '現金'
  };
  doc.fontSize(11)
     .font('Helvetica')
     .text(`支払い方法: ${paymentMethodMap[payment.paymentMethod] || payment.paymentMethod}`, 50, 430);

  // 備考
  doc.fontSize(10)
     .font('Helvetica')
     .text('※ この領収書は電子領収書です。', 50, 480)
     .text('※ 領収書番号: ' + receiptNumber, 50, 495)
     .text('※ お問い合わせ: support@kajishift.jp', 50, 510);

  // フッター
  doc.fontSize(8)
     .font('Helvetica')
     .text('© KAJISHIFT', 50, 750, { align: 'center' });
};

module.exports = {
  generateReceiptPDF
};
