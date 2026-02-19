/**
 * Swagger設定
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KAJISHIFT API',
      version: '1.0.0',
      description: '家事代行マッチングサービス「KAJISHIFT」のバックエンドAPIドキュメント',
      contact: {
        name: 'KAJISHIFT API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '開発環境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWTトークンを入力してください。例: Bearer {token}',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'エラータイプ',
            },
            message: {
              type: 'string',
              description: 'エラーメッセージ',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'メールアドレス',
            },
            name: {
              type: 'string',
              description: '名前',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: '電話番号',
            },
            role: {
              type: 'string',
              enum: ['CUSTOMER', 'WORKER', 'ADMIN'],
              description: 'ユーザーロール',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              description: 'ユーザーステータス',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '予約ID',
            },
            customerId: {
              type: 'string',
              format: 'uuid',
              description: '顧客ID',
            },
            workerId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'ワーカーID',
            },
            serviceType: {
              type: 'string',
              description: 'サービス種類',
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              description: '予約日時',
            },
            startTime: {
              type: 'string',
              description: '開始時間（HH:mm形式）',
            },
            duration: {
              type: 'integer',
              description: '時間数',
            },
            address: {
              type: 'string',
              description: '住所',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'メモ',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              description: '予約ステータス',
            },
            totalAmount: {
              type: 'integer',
              nullable: true,
              description: '合計金額（円）',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '通知ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            type: {
              type: 'string',
              enum: ['MESSAGE', 'BOOKING_UPDATE', 'BOOKING_CREATED', 'BOOKING_CANCELLED', 'REVIEW', 'PAYMENT', 'PAYMENT_FAILED', 'SYSTEM', 'WORKER_APPROVED', 'WORKER_REJECTED'],
              description: '通知タイプ',
            },
            title: {
              type: 'string',
              description: '通知タイトル',
            },
            content: {
              type: 'string',
              description: '通知内容',
            },
            isRead: {
              type: 'boolean',
              description: '既読フラグ',
            },
            relatedId: {
              type: 'string',
              nullable: true,
              description: '関連するエンティティのID',
            },
            relatedType: {
              type: 'string',
              nullable: true,
              description: '関連するエンティティのタイプ',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ファイルID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            filePath: {
              type: 'string',
              description: 'ファイルパス',
            },
            originalName: {
              type: 'string',
              description: '元のファイル名',
            },
            mimeType: {
              type: 'string',
              description: 'MIMEタイプ',
            },
            fileSize: {
              type: 'integer',
              description: 'ファイルサイズ（バイト）',
            },
            fileType: {
              type: 'string',
              enum: ['PROFILE_IMAGE', 'ID_DOCUMENT', 'GENERAL'],
              description: 'ファイルタイプ',
            },
            url: {
              type: 'string',
              description: 'ファイルURL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
          },
        },
      },
    },
    tags: [
      {
        name: '認証',
        description: '認証関連のAPI',
      },
      {
        name: 'ユーザー',
        description: 'ユーザー管理API',
      },
      {
        name: '予約',
        description: '予約管理API',
      },
      {
        name: 'ワーカー',
        description: 'ワーカー管理API',
      },
      {
        name: 'レビュー',
        description: 'レビュー管理API',
      },
      {
        name: 'チャット',
        description: 'チャットメッセージAPI',
      },
      {
        name: '決済',
        description: '決済管理API',
      },
      {
        name: 'サポート',
        description: 'サポート問い合わせAPI',
      },
      {
        name: '管理者',
        description: '管理者専用API',
      },
      {
        name: '通知',
        description: '通知管理API',
      },
      {
        name: 'ファイルアップロード',
        description: 'ファイルアップロード管理API',
      },
      {
        name: 'その他',
        description: 'その他のAPI',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/index.js'], // アノテーションを含むファイルのパス
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
