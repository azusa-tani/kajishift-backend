const express = require('express');
const router = express.Router();
const workerTestSubmissionController = require('../controllers/workerTestSubmissionController');
const { authorize } = require('../middleware/auth');
const { requireOperation } = require('../middleware/operationGuard');

router.use(authorize('WORKER'));

router.get('/', workerTestSubmissionController.getMyLatestSubmission);
router.post('/', requireOperation('profileWrite'), workerTestSubmissionController.submitWorkerTest);

module.exports = router;
