const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const backupFile = process.argv[2];
const restoreDatabaseUrl = process.env.RESTORE_DATABASE_URL;
const pgRestore = process.env.PG_RESTORE_PATH || 'pg_restore';

if (!backupFile) {
  console.error('Usage: npm run backup:restore-drill -- <backup-file>');
  process.exit(1);
}

if (!restoreDatabaseUrl) {
  console.error('RESTORE_DATABASE_URL is required');
  process.exit(1);
}

if (process.env.RESTORE_DRILL_CONFIRM !== 'verification-db') {
  console.error('RESTORE_DRILL_CONFIRM=verification-db is required to avoid restoring into the wrong database');
  process.exit(1);
}

const getEncryptionKey = () => {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) return null;
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  const base64 = Buffer.from(raw, 'base64');
  if (base64.length === 32) return base64;
  return crypto.createHash('sha256').update(raw).digest();
};

const decryptIfNeeded = (file) => {
  const input = fs.readFileSync(file);
  const magic = input.subarray(0, 6).toString();
  if (magic !== 'KSBAK1') {
    return { file, cleanup: null, encrypted: false };
  }

  const key = getEncryptionKey();
  if (!key) {
    throw new Error('BACKUP_ENCRYPTION_KEY is required to decrypt this backup');
  }

  const iv = input.subarray(6, 18);
  const tag = input.subarray(18, 34);
  const encrypted = input.subarray(34);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const tempFile = path.join(os.tmpdir(), `kajishift-restore-${Date.now()}.dump`);
  fs.writeFileSync(tempFile, decrypted);
  return { file: tempFile, cleanup: tempFile, encrypted: true };
};

const main = () => {
  const prepared = decryptIfNeeded(backupFile);
  try {
    const restore = spawnSync(pgRestore, [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-acl',
      '--dbname',
      restoreDatabaseUrl,
      prepared.file
    ], { stdio: 'inherit' });

    if (restore.status !== 0) {
      process.exit(restore.status || 1);
    }

    const evidence = {
      backupFile,
      encrypted: prepared.encrypted,
      restoredAt: new Date().toISOString(),
      rpoHours: 24,
      rtoHours: 4,
      target: 'verification-db'
    };
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    if (prepared.cleanup) {
      fs.rmSync(prepared.cleanup, { force: true });
    }
  }
};

main();
