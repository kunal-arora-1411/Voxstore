const express = require('express');
const Site = require('../models/Site');
const { authMiddleware } = require('../middleware/authMiddleware');
const { analyticsLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/analytics/ping/:siteId — called by tracking pixel, no auth needed
router.get('/ping/:siteId', analyticsLimiter, async (req, res) => {
  try {
    await Site.updateOne({ _id: req.params.siteId }, { $inc: { visitCount: 1 } });
  } catch {
    // Silently ignore — never let analytics break the visitor's page load
  }
  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif').set('Cache-Control', 'no-store').send(pixel);
});

// GET /api/analytics/:siteId — protected, returns visit count
router.get('/:siteId', authMiddleware, async (req, res, next) => {
  try {
    const site = await Site.findOne(
      { _id: req.params.siteId, userId: req.user.id },
      'visitCount shopName'
    );
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json({ siteId: req.params.siteId, shopName: site.shopName, visitCount: site.visitCount });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
