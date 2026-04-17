/**
 * ワーカー本人の利用不可スロット
 * マウント: /api/workers/me/unavailable-slots （authenticate + authorize(WORKER) 済み想定）
 */

const express = require('express');
const router = express.Router();
const workerUnavailableSlotController = require('../controllers/workerUnavailableSlotController');

router.get('/', workerUnavailableSlotController.list);
router.post('/', workerUnavailableSlotController.create);
router.put('/sync', workerUnavailableSlotController.sync);
router.delete('/', workerUnavailableSlotController.removeByQuery);
router.delete('/:id', workerUnavailableSlotController.removeById);

module.exports = router;
