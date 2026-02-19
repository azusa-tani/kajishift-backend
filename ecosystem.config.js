/**
 * PM2設定ファイル
 * 本番環境でのプロセス管理用
 * 
 * 使用方法:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [{
    name: 'kajishift-api',
    script: './src/index.js',
    instances: 'max', // CPUコア数に応じて自動調整
    exec_mode: 'cluster', // クラスターモード
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // ログ設定
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 自動再起動設定
    autorestart: true,
    watch: false, // 本番環境ではfalse
    max_memory_restart: '1G', // メモリ使用量が1GBを超えたら再起動
    // その他の設定
    min_uptime: '10s', // 10秒以上稼働していれば正常とみなす
    max_restarts: 10, // 10回以上再起動したら停止
    restart_delay: 4000 // 再起動の遅延（ミリ秒）
  }]
};
