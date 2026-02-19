/**
 * テストデータシードスクリプト
 * 実行方法: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 テストデータの作成を開始します...');

  // 既存のデータをクリア（オプション）
  console.log('🗑️  既存のデータをクリア中...');
  await prisma.favorite.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.file.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // パスワードハッシュ（すべてのユーザーで "password123" を使用）
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==================== ユーザー作成 ====================
  console.log('👥 ユーザーを作成中...');

  // 管理者
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kajishift.com',
      password: hashedPassword,
      name: '管理者 太郎',
      phone: '090-0000-0001',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ 管理者を作成しました:', admin.email);

  // 依頼者（顧客）
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      password: hashedPassword,
      name: '山田 花子',
      phone: '090-1234-5678',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: '札幌市中央区南1条西1丁目1-1',
    },
  });
  console.log('✅ 依頼者1を作成しました:', customer1.email);

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      password: hashedPassword,
      name: '佐藤 太郎',
      phone: '090-2345-6789',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      address: '札幌市中央区南2条西2丁目2-2',
    },
  });
  console.log('✅ 依頼者2を作成しました:', customer2.email);

  // ワーカー
  const worker1 = await prisma.user.create({
    data: {
      email: 'worker1@example.com',
      password: hashedPassword,
      name: '田中 美咲',
      phone: '090-3456-7890',
      role: 'WORKER',
      status: 'ACTIVE',
      bio: '家事代行歴5年。掃除と料理が得意です。丁寧な仕事を心がけています。',
      hourlyRate: 2500,
      rating: 4.8,
      reviewCount: 15,
      approvalStatus: 'APPROVED',
      bankName: '北海道銀行',
      branchName: '中央支店',
      accountType: 'ordinary',
      accountNumber: '1234567',
      accountName: 'タナカ ミサキ',
    },
  });
  console.log('✅ ワーカー1を作成しました:', worker1.email);

  const worker2 = await prisma.user.create({
    data: {
      email: 'worker2@example.com',
      password: hashedPassword,
      name: '鈴木 一郎',
      phone: '090-4567-8901',
      role: 'WORKER',
      status: 'ACTIVE',
      bio: '料理と買い物代行が専門です。新鮮な食材を選ぶのが得意です。',
      hourlyRate: 3000,
      rating: 4.9,
      reviewCount: 8,
      approvalStatus: 'APPROVED',
      bankName: '三菱UFJ銀行',
      branchName: '札幌支店',
      accountType: 'ordinary',
      accountNumber: '7654321',
      accountName: 'スズキ イチロウ',
    },
  });
  console.log('✅ ワーカー2を作成しました:', worker2.email);

  const worker3 = await prisma.user.create({
    data: {
      email: 'worker3@example.com',
      password: hashedPassword,
      name: '高橋 さくら',
      phone: '090-5678-9012',
      role: 'WORKER',
      status: 'ACTIVE',
      bio: '洗濯とアイロンがけが得意です。シワ一つない仕上がりを目指します。',
      hourlyRate: 2200,
      rating: 4.6,
      reviewCount: 12,
      approvalStatus: 'APPROVED',
      bankName: 'みずほ銀行',
      branchName: '札幌中央支店',
      accountType: 'ordinary',
      accountNumber: '9876543',
      accountName: 'タカハシ サクラ',
    },
  });
  console.log('✅ ワーカー3を作成しました:', worker3.email);

  // ==================== 予約作成 ====================
  console.log('📅 予約を作成中...');

  // 今後の予約（PENDING, CONFIRMED, IN_PROGRESS）
  const now = new Date();
  
  // 3日後の予約（CONFIRMED）
  const booking1Date = new Date(now);
  booking1Date.setDate(now.getDate() + 3);
  booking1Date.setHours(10, 0, 0, 0);

  const booking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      workerId: worker1.id,
      serviceType: '掃除・清掃',
      scheduledDate: booking1Date,
      startTime: '10:00',
      duration: 2,
      address: '札幌市中央区南1条西1丁目1-1',
      notes: 'リビングとキッチンの掃除、片付けをお願いします。掃除機とモップは用意してあります。',
      status: 'CONFIRMED',
      totalAmount: 5000, // 2500円/時 × 2時間
    },
  });
  console.log('✅ 予約1を作成しました（3日後）');

  // 7日後の予約（CONFIRMED）
  const booking2Date = new Date(now);
  booking2Date.setDate(now.getDate() + 7);
  booking2Date.setHours(14, 0, 0, 0);

  const booking2 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      workerId: worker3.id,
      serviceType: '洗濯・アイロン',
      scheduledDate: booking2Date,
      startTime: '14:00',
      duration: 2,
      address: '札幌市中央区南1条西1丁目1-1',
      notes: '洗濯物の取り込みとアイロンがけをお願いします。シャツ5枚とパンツ3本です。',
      status: 'CONFIRMED',
      totalAmount: 4400, // 2200円/時 × 2時間
    },
  });
  console.log('✅ 予約2を作成しました（7日後）');

  // 10日後の予約（PENDING - ワーカー未選択）
  const booking3Date = new Date(now);
  booking3Date.setDate(now.getDate() + 10);
  booking3Date.setHours(9, 0, 0, 0);

  const booking3 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      workerId: null, // ワーカー未選択
      serviceType: '料理・作り置き',
      scheduledDate: booking3Date,
      startTime: '09:00',
      duration: 3,
      address: '札幌市中央区南1条西1丁目1-1',
      notes: '1週間分の作り置きをお願いします。メニューは相談させてください。',
      status: 'PENDING',
      totalAmount: null,
    },
  });
  console.log('✅ 予約3を作成しました（10日後、PENDING）');

  // 過去の予約（COMPLETED）
  const pastBooking1Date = new Date(now);
  pastBooking1Date.setDate(now.getDate() - 7);
  pastBooking1Date.setHours(10, 0, 0, 0);

  const pastBooking1 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      workerId: worker1.id,
      serviceType: '掃除・清掃',
      scheduledDate: pastBooking1Date,
      startTime: '10:00',
      duration: 2,
      address: '札幌市中央区南1条西1丁目1-1',
      notes: 'リビングとキッチンの掃除をお願いします。',
      status: 'COMPLETED',
      totalAmount: 5000,
    },
  });
  console.log('✅ 過去の予約1を作成しました（7日前、COMPLETED）');

  // 過去の予約（COMPLETED、レビュー済み）
  const pastBooking2Date = new Date(now);
  pastBooking2Date.setDate(now.getDate() - 14);
  pastBooking2Date.setHours(14, 0, 0, 0);

  const pastBooking2 = await prisma.booking.create({
    data: {
      customerId: customer1.id,
      workerId: worker2.id,
      serviceType: '料理・買い物',
      scheduledDate: pastBooking2Date,
      startTime: '14:00',
      duration: 2,
      address: '札幌市中央区南1条西1丁目1-1',
      notes: '週末の買い物と作り置きをお願いします。',
      status: 'COMPLETED',
      totalAmount: 6000, // 3000円/時 × 2時間
    },
  });
  console.log('✅ 過去の予約2を作成しました（14日前、COMPLETED）');

  // 過去の予約（CANCELLED）
  const pastBooking3Date = new Date(now);
  pastBooking3Date.setDate(now.getDate() - 3);
  pastBooking3Date.setHours(11, 0, 0, 0);

  const pastBooking3 = await prisma.booking.create({
    data: {
      customerId: customer2.id,
      workerId: worker1.id,
      serviceType: '掃除・清掃',
      scheduledDate: pastBooking3Date,
      startTime: '11:00',
      duration: 2,
      address: '札幌市中央区南2条西2丁目2-2',
      notes: '急用ができたためキャンセルしました。',
      status: 'CANCELLED',
      totalAmount: null,
    },
  });
  console.log('✅ 過去の予約3を作成しました（3日前、CANCELLED）');

  // ==================== レビュー作成 ====================
  console.log('⭐ レビューを作成中...');

  const review1 = await prisma.review.create({
    data: {
      bookingId: pastBooking1.id,
      reviewerId: customer1.id,
      revieweeId: worker1.id,
      rating: 5,
      comment: 'とても丁寧に掃除していただき、ありがとうございました。またお願いしたいです！',
    },
  });
  console.log('✅ レビュー1を作成しました');

  const review2 = await prisma.review.create({
    data: {
      bookingId: pastBooking2.id,
      reviewerId: customer1.id,
      revieweeId: worker2.id,
      rating: 5,
      comment: '美味しい作り置きをありがとうございました。買い物も新鮮な食材を選んでいただき、助かりました。',
    },
  });
  console.log('✅ レビュー2を作成しました');

  // ワーカーの評価を更新
  await prisma.user.update({
    where: { id: worker1.id },
    data: {
      rating: 4.8,
      reviewCount: 16,
    },
  });

  await prisma.user.update({
    where: { id: worker2.id },
    data: {
      rating: 4.9,
      reviewCount: 9,
    },
  });

  // ==================== 決済作成 ====================
  console.log('💳 決済を作成中...');

  const payment1 = await prisma.payment.create({
    data: {
      bookingId: pastBooking1.id,
      userId: customer1.id,
      amount: 5000,
      paymentMethod: 'credit_card',
      status: 'COMPLETED',
      transactionId: 'TXN_' + Date.now(),
    },
  });
  console.log('✅ 決済1を作成しました');

  const payment2 = await prisma.payment.create({
    data: {
      bookingId: pastBooking2.id,
      userId: customer1.id,
      amount: 6000,
      paymentMethod: 'credit_card',
      status: 'COMPLETED',
      transactionId: 'TXN_' + (Date.now() + 1),
    },
  });
  console.log('✅ 決済2を作成しました');

  // ==================== メッセージ作成 ====================
  console.log('💬 メッセージを作成中...');

  await prisma.message.create({
    data: {
      bookingId: booking1.id,
      senderId: customer1.id,
      receiverId: worker1.id,
      content: 'よろしくお願いします！',
      isRead: true,
    },
  });

  await prisma.message.create({
    data: {
      bookingId: booking1.id,
      senderId: worker1.id,
      receiverId: customer1.id,
      content: '承知いたしました。当日10時に伺います。',
      isRead: true,
    },
  });

  await prisma.message.create({
    data: {
      bookingId: booking1.id,
      senderId: customer1.id,
      receiverId: worker1.id,
      content: 'ありがとうございます！',
      isRead: false,
    },
  });
  console.log('✅ メッセージを作成しました');

  // ==================== 通知作成 ====================
  console.log('🔔 通知を作成中...');

  await prisma.notification.create({
    data: {
      userId: customer1.id,
      type: 'BOOKING_CREATED',
      title: '予約が確定しました',
      content: '3月17日の予約が確定しました。',
      isRead: false,
      relatedId: booking1.id,
      relatedType: 'BOOKING',
    },
  });

  await prisma.notification.create({
    data: {
      userId: customer1.id,
      type: 'MESSAGE',
      title: '新しいメッセージがあります',
      content: '田中 美咲さんからメッセージが届きました。',
      isRead: false,
      relatedId: booking1.id,
      relatedType: 'MESSAGE',
    },
  });
  console.log('✅ 通知を作成しました');

  // ==================== お気に入り作成 ====================
  console.log('❤️ お気に入りを作成中...');

  await prisma.favorite.create({
    data: {
      userId: customer1.id,
      workerId: worker1.id,
    },
  });

  await prisma.favorite.create({
    data: {
      userId: customer1.id,
      workerId: worker2.id,
    },
  });
  console.log('✅ お気に入りを作成しました');

  console.log('\n✨ テストデータの作成が完了しました！\n');
  console.log('📋 作成されたデータ:');
  console.log('  - ユーザー: 6名（管理者1、依頼者2、ワーカー3）');
  console.log('  - 予約: 6件（今後の予約3、過去の予約3）');
  console.log('  - レビュー: 2件');
  console.log('  - 決済: 2件');
  console.log('  - メッセージ: 3件');
  console.log('  - 通知: 2件');
  console.log('  - お気に入り: 2件');
  console.log('\n🔑 ログイン情報:');
  console.log('  依頼者1: customer1@example.com / password123');
  console.log('  依頼者2: customer2@example.com / password123');
  console.log('  ワーカー1: worker1@example.com / password123');
  console.log('  ワーカー2: worker2@example.com / password123');
  console.log('  ワーカー3: worker3@example.com / password123');
  console.log('  管理者: admin@kajishift.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
