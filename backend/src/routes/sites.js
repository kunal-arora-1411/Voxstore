const express = require('express');
const Site = require('../models/Site');
const { generateSite } = require('../services/openaiService');
const { generateBusinessProfile } = require('../services/businessProfileService');
const { sanitize } = require('../services/sanitizer');
const { deploy, swapAlias } = require('../services/vercelService');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateGenerate } = require('../middleware/validate');
const { ipLimiter, userGenerateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(authMiddleware);

// POST /api/sites/autofill
router.post('/autofill', ipLimiter, async (req, res, next) => {
  const shopName     = String(req.body?.shopName   || '').trim();
  const preferredTone      = String(req.body?.tone       || '').trim();
  const preferredColor     = String(req.body?.brandColor || '').trim();
  const preferredPricing   = String(req.body?.pricingTier || '').trim();

  if (shopName.length < 2 || shopName.length > 100) {
    return res.status(400).json({ error: 'Enter a shop name with at least 2 characters.' });
  }

  try {
    const profile = await generateBusinessProfile(shopName, preferredTone, preferredColor, preferredPricing);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

/**
 * Strips image base64 blobs from formData before storing in MongoDB.
 * We keep the image key list so we know what was provided, without storing MBs of base64.
 */
function stripImages(data) {
  const { logoImage, heroImage, shopPhotos, productPhotos, ...text } = data;
  return {
    ...text,
    hasLogoImage:    !!logoImage?.data,
    hasHeroImage:    !!heroImage?.data,
    shopPhotoCount:  (shopPhotos || []).filter(p => p?.data).length,
    productPhotoKeys: Object.keys(productPhotos || {}).filter(k => productPhotos[k]?.data),
  };
}

async function runPipeline(formData, siteId, backendUrl) {
  const {
    html: rawHtml,
    imageAssets,
    stitchProjectId,
    stitchScreenId,
  } = await generateSite(formData);
  let cleanHtml = sanitize(rawHtml);

  // Inject analytics pixel
  cleanHtml = cleanHtml.replace(
    '</body>',
    `<img src="${backendUrl}/api/analytics/ping/${siteId}" style="display:none" width="1" height="1" /></body>`
  );

  const { deployId, url } = await deploy(cleanHtml, siteId.toString(), imageAssets);
  return { html: cleanHtml, deployId, url, stitchProjectId, stitchScreenId };
}

// POST /api/sites/generate
router.post('/generate', ipLimiter, userGenerateLimiter, validateGenerate, async (req, res, next) => {
  const formData = req.body;
  const userId = req.user.id;
  const backendUrl = process.env.BACKEND_URL || '';

  let site;
  try {
    site = await Site.create({
      userId, shopName: formData.shopName,
      formData: stripImages(formData),
      status: 'pending',
    });
    await site.updateOne({ status: 'deploying' });

    const {
      html,
      deployId,
      url,
      stitchProjectId,
      stitchScreenId,
    } = await runPipeline(formData, site._id, backendUrl);

    await site.updateOne({
      generatedHtml: html,
      siteUrl: url,
      deployId,
      stitchProjectId,
      stitchScreenId,
      status: 'live',
    });

    console.log({ event: 'site_generated', userId, siteId: site._id, siteUrl: url });
    res.status(201).json({ siteId: site._id, siteUrl: url });
  } catch (err) {
    if (site) await site.updateOne({ status: 'error' });
    next(err);
  }
});

// GET /api/sites
router.get('/', async (req, res, next) => {
  try {
    const sites = await Site.find({ userId: req.user.id }, '-generatedHtml').sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) { next(err); }
});

// GET /api/sites/:id
router.get('/:id', async (req, res, next) => {
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user.id }, '-generatedHtml');
    if (!site) return res.status(404).json({ error: 'Site not found' });
    res.json(site);
  } catch (err) { next(err); }
});

// PUT /api/sites/:id/regenerate
router.put('/:id/regenerate', ipLimiter, userGenerateLimiter, validateGenerate, async (req, res, next) => {
  const backendUrl = process.env.BACKEND_URL || '';
  try {
    const site = await Site.findOne({ _id: req.params.id, userId: req.user.id });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const formData = req.body;
    await site.updateOne({ formData: stripImages(formData), shopName: formData.shopName, status: 'deploying' });

    const {
      html,
      deployId,
      url,
      stitchProjectId,
      stitchScreenId,
    } = await runPipeline(formData, site._id, backendUrl);

    // Atomic alias swap: new deployment takes the old URL
    if (site.deployId && site.siteUrl) {
      try {
        const aliasHost = new URL(site.siteUrl).host;
        await swapAlias(deployId, aliasHost);
      } catch { /* non-fatal */ }
    }

    await site.updateOne({
      generatedHtml: html,
      siteUrl: url,
      deployId,
      stitchProjectId,
      stitchScreenId,
      status: 'live',
      formData: stripImages(formData),
    });

    console.log({ event: 'site_regenerated', userId: req.user.id, siteId: site._id, siteUrl: url });
    res.json({ siteId: site._id, siteUrl: url });
  } catch (err) {
    await Site.updateOne({ _id: req.params.id }, { status: 'error' });
    next(err);
  }
});

module.exports = router;
