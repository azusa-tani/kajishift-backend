const assert = require('assert');
const fs = require('fs');
const path = require('path');

const routeDir = path.join(__dirname, '..', 'src', 'routes');

const guardedRoutes = [
  ['auth.js', "requireOperation('registerUser')"],
  ['bookings.js', "requireOperation('createBooking')"],
  ['bookings.js', "requireOperation('bookingWrite')"],
  ['payments.js', "requireOperation('createPaymentIntent')"],
  ['cards.js', "requireOperation('createSetupIntent')"],
  ['cards.js', "requireOperation('cardWrite')"],
  ['reviews.js', "requireOperation('createReview')"],
  ['messages.js', "requireOperation('sendMessage')"],
  ['upload.js', "requireOperation('uploadFile')"],
  ['upload.js', "requireOperation('deleteFile')"],
  ['favorites.js', "requireOperation('favoriteWrite')"],
  ['users.js', "requireOperation('profileWrite')"],
  ['workers.js', "requireOperation('profileWrite')"],
  ['notifications.js', "requireOperation('notificationWrite')"],
  ['workerUnavailableSlots.js', "requireOperation('workerAvailabilityWrite')"],
  ['admin.js', "requireOperationForMethods('adminWrite')"]
];

for (const [file, expected] of guardedRoutes) {
  const content = fs.readFileSync(path.join(routeDir, file), 'utf8');
  assert(
    content.includes(expected),
    `${file} must include ${expected}`
  );
}

const allowedUnguardedWrites = [
  ['auth.js', "router.post('/login'"],
  ['auth.js', "router.post('/forgot-password'"],
  ['auth.js', "router.post('/reset-password'"],
  ['support.js', "router.post('/'"],
  ['webhooks.js', 'router.post('],
  ['admin.js', "router.post('/ops/mode'"],
  ['admin.js', "router.post('/ops/reconcile-payments'"],
  ['admin.js', "router.post('/ops/evaluate-breakers'"]
];

const routeFiles = fs.readdirSync(routeDir).filter((file) => file.endsWith('.js'));
for (const file of routeFiles) {
  const content = fs.readFileSync(path.join(routeDir, file), 'utf8');
  const writeLines = content.split(/\r?\n/).filter((line) => /router\.(post|put|patch|delete)\(/.test(line));
  for (const line of writeLines) {
    const guarded = line.includes('requireOperation(') || line.includes('requireOperationForMethods(');
    const allowed = allowedUnguardedWrites.some(([allowedFile, marker]) => file === allowedFile && line.includes(marker));
    const coveredByAdminMiddleware = file === 'admin.js' && !line.includes('/ops/') && content.includes("router.use(requireOperationForMethods('adminWrite'))");
    assert(
      guarded || allowed || coveredByAdminMiddleware,
      `${file} has unguarded write route: ${line.trim()}`
    );
  }
}

console.log('Ops write guard coverage passed');
