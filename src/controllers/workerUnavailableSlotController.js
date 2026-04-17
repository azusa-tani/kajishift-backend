/**
 * ワーカー利用不可スロット API
 */

const workerUnavailableSlotService = require('../services/workerUnavailableSlotService');

const list = async (req, res, next) => {
  try {
    const data = await workerUnavailableSlotService.listSlots(
      req.user.id,
      req.query.startDate,
      req.query.endDate
    );
    res.json({ data });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (Array.isArray(body.items) && body.items.length > 0) {
      const continueOnError = Boolean(body.continueOnError);
      const data = await workerUnavailableSlotService.createBatch(
        req.user.id,
        body.items,
        continueOnError
      );
      return res.status(200).json({ data });
    }

    const date = body.date ?? body.localDate;
    const slotIndex = body.slotIndex;
    if (typeof date !== 'string' || !Number.isInteger(slotIndex)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '単一作成には date（YYYY-MM-DD）と slotIndex（0〜47）が必要です。複数は items 配列を使用してください。',
        code: 'INVALID_BODY'
      });
    }

    const result = await workerUnavailableSlotService.createSlot(req.user.id, date.trim(), slotIndex);
    const status = result.created ? 201 : 200;
    return res.status(status).json({ data: result });
  } catch (e) {
    next(e);
  }
};

const sync = async (req, res, next) => {
  try {
    const { startDate, endDate, slots } = req.body || {};
    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'startDate, endDate（YYYY-MM-DD）, slots が必要です',
        code: 'INVALID_BODY'
      });
    }
    const data = await workerUnavailableSlotService.syncRange(
      req.user.id,
      startDate.trim(),
      endDate.trim(),
      slots || []
    );
    res.json({ data });
  } catch (e) {
    next(e);
  }
};

const removeByQuery = async (req, res, next) => {
  try {
    const data = await workerUnavailableSlotService.deleteBySlot(
      req.user.id,
      req.query.date,
      req.query.slotIndex
    );
    res.json({ data });
  } catch (e) {
    next(e);
  }
};

const removeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '無効なID形式です',
        code: 'INVALID_ID'
      });
    }
    const data = await workerUnavailableSlotService.deleteById(req.user.id, id);
    res.json({ data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  list,
  create,
  sync,
  removeByQuery,
  removeById
};
