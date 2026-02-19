/**
 * データベースの状態を確認するスクリプト
 */

require('dotenv').config();
const prisma = require('../src/config/database');

async function checkDatabase() {
  try {
    console.log('📊 データベースの状態を確認中...\n');

    // データベース接続確認
    await prisma.$connect();
    console.log('✅ データベース接続成功\n');

    // ユーザー統計
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const stats = {
      total: users.length,
      byStatus: {
        ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
        INACTIVE: users.filter(u => u.status === 'INACTIVE').length,
        SUSPENDED: users.filter(u => u.status === 'SUSPENDED').length
      },
      byRole: {
        CUSTOMER: users.filter(u => u.role === 'CUSTOMER').length,
        WORKER: users.filter(u => u.role === 'WORKER').length,
        ADMIN: users.filter(u => u.role === 'ADMIN').length
      },
      byStatusAndRole: {
        ACTIVE: {
          CUSTOMER: users.filter(u => u.status === 'ACTIVE' && u.role === 'CUSTOMER').length,
          WORKER: users.filter(u => u.status === 'ACTIVE' && u.role === 'WORKER').length,
          ADMIN: users.filter(u => u.status === 'ACTIVE' && u.role === 'ADMIN').length
        }
      }
    };

    console.log('📈 ユーザー統計:');
    console.log(`   総ユーザー数: ${stats.total}`);
    console.log(`   ステータス別:`);
    console.log(`     - ACTIVE: ${stats.byStatus.ACTIVE}`);
    console.log(`     - INACTIVE: ${stats.byStatus.INACTIVE}`);
    console.log(`     - SUSPENDED: ${stats.byStatus.SUSPENDED}`);
    console.log(`   ロール別:`);
    console.log(`     - CUSTOMER: ${stats.byRole.CUSTOMER}`);
    console.log(`     - WORKER: ${stats.byRole.WORKER}`);
    console.log(`     - ADMIN: ${stats.byRole.ADMIN}`);
    console.log(`   アクティブユーザー（ロール別）:`);
    console.log(`     - CUSTOMER: ${stats.byStatusAndRole.ACTIVE.CUSTOMER}`);
    console.log(`     - WORKER: ${stats.byStatusAndRole.ACTIVE.WORKER}`);
    console.log(`     - ADMIN: ${stats.byStatusAndRole.ACTIVE.ADMIN}`);

    if (users.length > 0) {
      console.log('\n👥 ユーザー一覧（最新10件）:');
      users.slice(0, 10).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        console.log(`      ロール: ${user.role}, ステータス: ${user.status}`);
      });
    } else {
      console.log('\n⚠️  データベースにユーザーが存在しません');
      console.log('   システム通知を送信するには、まずユーザーを登録してください。');
    }

    if (stats.byStatus.ACTIVE === 0 && stats.total > 0) {
      console.log('\n⚠️  警告: アクティブなユーザーが0人です');
      console.log('   システム通知を送信するには、アクティブなユーザーが必要です。');
    }

    console.log('\n✅ 確認完了');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    if (error.code === 'P1001') {
      console.error('   データベースサーバーに接続できません。Dockerコンテナが起動しているか確認してください。');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
