const { z } = require('zod');

const imageSchema = z.object({
  data: z.string().min(1),
  ext: z.string().default('jpg'),
  sizeKb: z.number().optional(),
  originalName: z.string().optional(),
  preview: z.string().optional(), // strip on backend — not stored
}).nullable().optional();

const generateSchema = z.object({
  // Core text fields
  shopName:    z.string().min(1).max(100).trim(),
  tagline:     z.string().max(200).trim().optional().default(''),
  products:    z.array(z.string().max(200).trim()).max(20).default([]),
  hours:       z.string().max(200).trim().default('Mon–Fri 9am–6pm'),
  address:     z.string().max(300).trim().optional().default(''),
  description: z.string().max(600).trim().optional().default(''),
  promotions:  z.string().max(400).trim().optional().default(''),

  // Style
  tone:       z.enum(['professional', 'friendly', 'minimal', 'bold']).default('professional'),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color like #2563eb').default('#2563eb'),
  pricingTier: z.enum(['budget', 'midrange', 'premium']).optional().default('midrange'),

  // Contact
  phone:     z.string().max(50).trim().optional().default(''),
  email:     z.string().max(200).trim().optional().default(''),
  website:   z.string().max(300).trim().optional().default(''),
  instagram: z.string().max(100).trim().optional().default(''),
  facebook:  z.string().max(300).trim().optional().default(''),

  // Features
  specialFeatures: z.array(z.string().max(50)).max(10).optional().default([]),

  // Images — validated but stripped before MongoDB save
  logoImage:     imageSchema,
  heroImage:     imageSchema,
  shopPhotos:    z.array(
    z.object({
      data:  z.string().min(1),
      ext:   z.string().default('jpg'),
      label: z.string().optional(),
      preview: z.string().optional(),
      sizeKb: z.number().optional(),
    })
  ).max(3).optional().default([]),
  productPhotos: z.record(
    z.object({ data: z.string().min(1), ext: z.string().default('jpg'), preview: z.string().optional(), sizeKb: z.number().optional() })
  ).optional().default({}),
});

function validateGenerate(req, res, next) {
  const result = generateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
  }
  req.body = result.data;
  next();
}

module.exports = { validateGenerate };
