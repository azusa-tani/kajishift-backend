const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const alertTargets = (process.env.OPS_ALERT_WEBHOOK_URLS || process.env.OPS_ALERT_WEBHOOK_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const sendAlert = async (title, severity, message, details = {}) => {
  if (alertTargets.length === 0) return;
  await Promise.allSettled(alertTargets.map((url) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      severity,
      message,
      service: 'kajishift-backup',
      timestamp: new Date().toISOString(),
      details
    })
  })));
};

const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(backupDir, `kajishift-${timestamp}.dump`);
const encryptedFile = `${outputFile}.enc`;
const pgDump = process.env.PG_DUMP_PATH || 'pg_dump';
const pgRestore = process.env.PG_RESTORE_PATH || 'pg_restore';
const retentionCount = Number(process.env.BACKUP_RETENTION_COUNT || 7);
const allowUnencrypted = process.env.ALLOW_UNENCRYPTED_BACKUP === 'true';

const getEncryptionKey = () => {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) {
    if (allowUnencrypted) return null;
    throw new Error('BACKUP_ENCRYPTION_KEY is required. Set ALLOW_UNENCRYPTED_BACKUP=true only for local dry-runs.');
  }

  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, 'hex');
  }

  const base64 = Buffer.from(raw, 'base64');
  if (base64.length === 32) {
    return base64;
  }

  return crypto.createHash('sha256').update(raw).digest();
};

const encryptBackup = (sourceFile, targetFile) => {
  const key = getEncryptionKey();
  if (!key) {
    return { encrypted: false, file: sourceFile };
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const input = fs.readFileSync(sourceFile);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const tag = cipher.getAuthTag();
  fs.writeFileSync(targetFile, Buffer.concat([Buffer.from('KSBAK1'), iv, tag, encrypted]));
  fs.rmSync(sourceFile, { force: true });
  return { encrypted: true, file: targetFile, algorithm: 'aes-256-gcm' };
};

const pruneOldBackups = () => {
  const manifests = fs.readdirSync(backupDir)
    .filter((file) => file.endsWith('.manifest.json'))
    .map((file) => path.join(backupDir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  const deleted = [];
  for (const manifestPath of manifests.slice(retentionCount)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      [manifest.file, manifest.rawFile, manifestPath].filter(Boolean).forEach((target) => {
        if (fs.existsSync(target)) {
          fs.rmSync(target, { force: true });
          deleted.push(target);
        }
      });
    } catch (error) {
      console.error(`Failed to prune backup manifest ${manifestPath}: ${error.message}`);
    }
  }

  return deleted;
};

const main = async () => {
  const encryptionKey = getEncryptionKey();
  const dump = spawnSync(pgDump, [
    '--format=custom',
    '--no-owner',
    '--no-acl',
    '--file',
    outputFile,
    '--dbname',
    databaseUrl
  ], { stdio: 'inherit' });

  if (dump.error || dump.status !== 0) {
    const message = dump.error
      ? `pg_dump failed to start: ${dump.error.message}`
      : `pg_dump failed with exit code ${dump.status}`;
    console.error(message);
    await sendAlert('KAJISHIFT database backup failed', 'critical', message, { outputFile });
    process.exit(dump.status || 1);
  }

  const verify = spawnSync(pgRestore, ['--list', outputFile], { encoding: 'utf8' });
  if (verify.error || verify.status !== 0) {
    const message = verify.error
      ? `pg_restore failed to start: ${verify.error.message}`
      : verify.stderr || `pg_restore --list failed with exit code ${verify.status}`;
    console.error(message);
    await sendAlert('KAJISHIFT database backup verification failed', 'critical', message, { outputFile });
    process.exit(verify.status || 1);
  }

  const encrypted = encryptBackup(outputFile, encryptedFile);
  const manifest = {
    file: encrypted.file,
    rawFile: encrypted.encrypted ? outputFile : null,
    encrypted: encrypted.encrypted,
    encryptionAlgorithm: encrypted.algorithm || null,
    createdAt: new Date().toISOString(),
    retentionCount,
    rpoHours: 24,
    rtoHours: 4,
    sizeBytes: fs.statSync(encrypted.file).size,
    verifyPreview: verify.stdout.split(/\r?\n/).slice(0, 20),
    encryptionConfigured: Boolean(encryptionKey),
    restoreDrill: {
      requiredWeekly: true,
      command: 'RESTORE_DRILL_CONFIRM=verification-db RESTORE_DATABASE_URL=... npm run backup:restore-drill -- <backup-file>'
    }
  };

  const manifestFile = `${encrypted.file}.manifest.json`;
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  const pruned = pruneOldBackups();

  await sendAlert('KAJISHIFT database backup succeeded', 'info', 'Database backup, encryption and pg_restore --list verification succeeded.', {
    ...manifest,
    prunedCount: pruned.length
  });

  console.log(`Backup created: ${encrypted.file}`);
  console.log(`Manifest created: ${manifestFile}`);
  if (pruned.length > 0) {
    console.log(`Pruned old backup files: ${pruned.length}`);
  }
};

main().catch(async (error) => {
  console.error(error);
  await sendAlert('KAJISHIFT database backup failed', 'critical', error.message);
  process.exit(1);
});
