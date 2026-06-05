const express = require('express');
const router = express.Router();
const { getOperationStatus } = require('../config/operationMode');

router.get('/status', async (req, res, next) => {
  try {
    const status = await getOperationStatus();
    res.set('Cache-Control', 'no-store');
    res.json({
      data: {
        ...status,
        support: {
          email: process.env.PUBLIC_SUPPORT_EMAIL || 'support@kajishift.jp',
          url: process.env.PUBLIC_SUPPORT_URL || 'https://kajishift-frontend.vercel.app/legal.html#contact'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status/health', async (req, res, next) => {
  try {
    const status = await getOperationStatus();
    res.set('Cache-Control', 'no-store');
    res.json({
      status: status.isNormal ? 'OK' : 'DEGRADED',
      operation: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
