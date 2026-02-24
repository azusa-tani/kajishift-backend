/**
 * 本番データベースにシードデータを投入するスクリプト
 * 環境変数DATABASE_URLを使用して実行
 * 使用方法: node scripts/seed-production-env.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// DATABASE_URLの確認
if (!process.env.DATABASE_URL) {
  console.error('❌ エラー: DATABASE_URL環境変数が設定されていません');
  console.log('');
  console.log('以下の手順でDATABASE_URLを設定してください:');
  console.log('1. Renderダッシュボードにアクセス');
  console.log('2. kajishift-db（またはkajishift-postgres）を開く');
  console.log('3. 「Connections」タブから「Internal Database URL」をコピー');
  console.log('4. 以下のコマンドを実行:');
  console.log('   export DATABASE_URL="<コピーしたURL>"; node scripts/seed-production-env.js');
  console.log('');
  process.exit(1);
}

// DATABASE_URLの確認（本番環境かどうか）
if (!process.env.DATABASE_URL.includes('onrender.com') && !process.env.DATABASE_URL.includes('render.com')) {
  console.log('⚠️  警告: DATABASE_URLが本番環境（Render）のものではない可能性があります');
  console.log(`現在のDATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
  console.log('');
  // 非対話モードのため、警告のみ表示して続行
}

console.log('✅ DATABASE_URLが設定されています');
console.log('');

// プロジェクトルートに移動
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log(`📁 プロジェクトルート: ${projectRoot}`);
console.log('');

// Prismaクライアントの生成
console.log('🔧 Prismaクライアントを生成中...');
try {
  execSync('npm run prisma:generate', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Prismaクライアントの生成に失敗しました');
  process.exit(1);
}

console.log('');

// シードデータの投入
console.log('🌱 シードデータを投入中...');
console.log('');

try {
  execSync('npm run seed', { stdio: 'inherit' });
  
  console.log('');
  console.log('========================================');
  console.log('✅ シードデータの投入が完了しました！');
  console.log('========================================');
  console.log('');
  console.log('📋 作成されたテストユーザー:');
  console.log('  依頼者1: customer1@example.com / password123');
  console.log('  依頼者2: customer2@example.com / password123');
  console.log('  ワーカー1: worker1@example.com / password123');
  console.log('  ワーカー2: worker2@example.com / password123');
  console.log('  ワーカー3: worker3@example.com / password123');
  console.log('  管理者: admin@kajishift.com / password123');
  console.log('');
  console.log('🔍 確認方法:');
  console.log('  https://kajishift-api.onrender.com/api/health/db');
  console.log('');
} catch (error) {
  console.error('');
  console.error('❌ シードデータの投入に失敗しました');
  process.exit(1);
}
