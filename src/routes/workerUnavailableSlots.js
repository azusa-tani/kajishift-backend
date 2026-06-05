/**
 * ワーカー本人の利用不可スロット
 * マウント: /api/workers/me/unavailable-slots （authenticate + authorize(WORKER) 済み想定）
 */

const express = require('express');
const router = express.Router();
const workerUnavailableSlotController = require('../controllers/workerUnavailableSlotController');
const { requireOperation } = require('../middleware/operationGuard');

router.get('/', workerUnavailableSlotController.list);
router.post('/', requireOperation('workerAvailabilityWrite'), workerUnavailableSlotController.create);
router.put('/sync', requireOperation('workerAvailabilityWrite'), workerUnavailableSlotController.sync);
router.delete('/', requireOperation('workerAvailabilityWrite'), workerUnavailableSlotController.removeByQuery);
router.delete('/:id', requireOperation('workerAvailabilityWrite'), workerUnavailableSlotController.removeById);

module.exports = router;
