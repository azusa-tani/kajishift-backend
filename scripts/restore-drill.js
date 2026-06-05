const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const backupFile = process.argv[2];
const restoreDatabaseUrl = process.env.RESTORE_DATABASE_URL;
const pgRestore = process.env.PG_RESTORE_PATH || 'pg_restore';
const databaseUrl = process.env.DATABASE_URL;

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

const redactDatabaseUrl = (value) => {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.username ? `${parsed.username}:***@` : ''}${parsed.host}${parsed.pathname}`;
  } catch (error) {
    return 'invalid-url';
  }
};

const getDatabaseIdentity = (value) => {
  try {
    const parsed = new URL(value);
    return {
      host: parsed.hostname,
      port: parsed.port || null,
      database: parsed.pathname.replace(/^\//, '')
    };
  } catch (error) {
    return null;
  }
};

const assertRestoreTargetIsSafe = () => {
  if (!databaseUrl) return;
  const source = getDatabaseIdentity(databaseUrl);
  const target = getDatabaseIdentity(restoreDatabaseUrl);
  if (!source || !target) return;

  if (source.host === target.host && source.port === target.port && source.database === target.database) {
    console.error('RESTORE_DATABASE_URL must not point to the same database as DATABASE_URL');
    process.exit(1);
  }
};

const getEncryptionKey = () => {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) return null;
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  const base64 = Buffer.from(raw, 'base64');
  if (base64.length === 32) return base64;
  return crypto.createHash('sha256').update(raw).digest();
};

const getEncryptionKeyInfo = () => {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) {
    return { present: false, format: 'missing', rawLength: 0 };
  }
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return { present: true, format: 'hex-32-byte', rawLength: raw.length };
  }
  const base64 = Buffer.from(raw, 'base64');
  if (base64.length === 32) {
    return { present: true, format: 'base64-32-byte', rawLength: raw.length };
  }
  return { present: true, format: 'passphrase-sha256-derived', rawLength: raw.length };
};

const decryptIfNeeded = (file) => {
  if (!fs.existsSync(file)) {
    throw new Error(`Backup file does not exist: ${file}`);
  }

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

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...options
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  return result;
};

const main = () => {
  assertRestoreTargetIsSafe();

  console.log(JSON.stringify({
    event: 'restore_drill_start',
    backupFile,
    backupFileExists: fs.existsSync(backupFile),
    backupFileSizeBytes: fs.existsSync(backupFile) ? fs.statSync(backupFile).size : null,
    restoreDatabase: redactDatabaseUrl(restoreDatabaseUrl),
    pgRestore,
    encryptionKey: getEncryptionKeyInfo()
  }, null, 2));

  const version = runCommand(pgRestore, ['--version']);
  if (version.error || version.status !== 0) {
    console.error(version.error ? `pg_restore failed to start: ${version.error.message}` : `pg_restore --version failed with exit code ${version.status}`);
    process.exit(version.status || 1);
  }

  const prepared = decryptIfNeeded(backupFile);
  try {
    console.log(JSON.stringify({
      event: 'restore_drill_backup_prepared',
      encrypted: prepared.encrypted,
      preparedFileSizeBytes: fs.statSync(prepared.file).size
    }, null, 2));

    const list = runCommand(pgRestore, ['--list', prepared.file]);
    if (list.error || list.status !== 0) {
      console.error(list.error ? `pg_restore --list failed to start: ${list.error.message}` : `pg_restore --list failed with exit code ${list.status}`);
      process.exit(list.status || 1);
    }

    const restore = runCommand(pgRestore, [
      '--verbose',
      '--clean',
      '--if-exists',
      '--exit-on-error',
      '--single-transaction',
      '--no-owner',
      '--no-acl',
      '--dbname',
      restoreDatabaseUrl,
      prepared.file
    ]);

    if (restore.error) {
      console.error(`pg_restore failed to start: ${restore.error.message}`);
      process.exit(1);
    }

    if (restore.status !== 0) {
      console.error(`pg_restore failed with exit code ${restore.status}`);
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
