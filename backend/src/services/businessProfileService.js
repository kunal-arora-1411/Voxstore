const { getClient } = require('./openaiService');
const { loadThemeDesign } = require('./themeDesignService');

const TONES = new Set(['friendly', 'professional', 'minimal', 'bold']);
const PRICING_TIERS = new Set(['budget', 'midrange', 'premium']);
const FEATURES = new Set([
  'vegan', 'dog', 'accessible', 'wifi', 'outdoor',
  'parking', 'delivery', 'ordering', 'giftcard', 'loyalty',
]);

function parseJsonObject(value) {
  const cleaned = String(value || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Normalise the AI response and enforce user-selected values.
 * preferredTone, preferredColor, preferredPricing come directly from the
 * user's form selections — they always win over AI-generated values.
 */
function normalizeProfile(profile, shopName, preferredTone, preferredColor, preferredPricing) {
  const products = Array.isArray(profile.products)
    ? profile.products.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];
  const specialFeatures = Array.isArray(profile.specialFeatures)
    ? profile.specialFeatures.filter((item) => FEATURES.has(item)).slice(0, 5)
    : [];

  // User-selected tone wins; fall back to AI suggestion, then default
  const tone = TONES.has(preferredTone)
    ? preferredTone
    : (TONES.has(profile.tone) ? profile.tone : 'friendly');

  // User-selected colour wins; fall back to AI suggestion, then default
  const brandColor = /^#[0-9a-f]{6}$/i.test(preferredColor || '')
    ? preferredColor
    : (/^#[0-9a-f]{6}$/i.test(profile.brandColor || '') ? profile.brandColor : '#2563eb');

  // User-selected pricing wins; fall back to AI suggestion, then default
  const pricingTier = PRICING_TIERS.has(preferredPricing)
    ? preferredPricing
    : (PRICING_TIERS.has(profile.pricingTier) ? profile.pricingTier : 'midrange');

  return {
    shopName,
    tagline:    String(profile.tagline    || '').trim().slice(0, 200),
    products,
    hours:      String(profile.hours      || 'Mon-Sat 9am-6pm').trim().slice(0, 200),
    description:String(profile.description|| '').trim().slice(0, 600),
    promotions: String(profile.promotions || '').trim().slice(0, 400),
    tone,
    brandColor,
    pricingTier,
    specialFeatures,
  };
}

/**
 * Generates a brand profile from just a shop name.
 * The user's selected tone, brandColor, and pricingTier are injected into the
 * AI prompt so the generated copy (tagline, description, products) is written
 * to match the visual personality they've already chosen.
 */
async function generateBusinessProfile(shopName, preferredTone, preferredColor, preferredPricing) {
  const tone        = TONES.has(preferredTone)    ? preferredTone    : 'friendly';
  const pricingTier = PRICING_TIERS.has(preferredPricing) ? preferredPricing : 'midrange';
  const brandColor  = /^#[0-9a-f]{6}$/i.test(preferredColor || '') ? preferredColor : null;

  // Load the DESIGN.md for the selected tone so the AI generates copy and
  // product choices that naturally match the visual design it will be placed in.
  let themeContext = '';
  try {
    const design = loadThemeDesign(tone);
    // Extract just the first 400 chars (positioning statement) — enough to
    // bias the copy direction without blowing the token budget.
    themeContext = design.slice(0, 400);
  } catch { /* non-fatal — proceed without it */ }

  const toneDescriptions = {
    friendly:     'warm, conversational, neighbourly — feels like a trusted local friend',
    professional: 'polished, authoritative, trustworthy — clean and considered',
    minimal:      'quiet, understated, content-forward — spacious and precise',
    bold:         'punchy, confident, energetic — big personality, direct voice',
  };

  const pricingDescriptions = {
    budget:   'affordable and accessible — great value for everyone',
    midrange: 'fair price for quality craft — honest and dependable',
    premium:  'luxury positioning — price reflects exceptional quality and expertise',
  };

  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.8,
    max_tokens: 900,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a senior brand strategist and copywriter specialising in small-business websites.
Given a business name and its selected visual design direction, generate a brand profile whose
copy, tone, product names, and tagline naturally complement the chosen design personality.

Rules:
- Do NOT use filler, lorem ipsum, or generic phrases like "quality products and excellent service."
- Make the concept specific and distinctive — it should feel like a real, well-considered brand.
- Avoid unverifiable facts: no awards, founding dates, exact locations, certifications, or team size.
- Frame description as what the brand offers and how it feels, not unsupported factual history.
- Tagline must reflect the selected tone (${toneDescriptions[tone]}).
- Products/services should feel premium/budget/mid-range appropriate to: ${pricingDescriptions[pricingTier]}.
${themeContext ? `\nDesign personality context (use to align copy voice):\n${themeContext}` : ''}`,
      },
      {
        role: 'user',
        content: `Create a brand profile for "${shopName}".

Selected design direction:
- Tone: ${tone} (${toneDescriptions[tone]})
- Pricing: ${pricingTier} (${pricingDescriptions[pricingTier]})${brandColor ? `\n- Brand colour: ${brandColor}` : ''}

Return exactly these JSON fields:
{
  "tagline": "short memorable line that fits the ${tone} tone",
  "products": ["3 to 6 specific products or services, named and priced appropriately for ${pricingTier}"],
  "hours": "plausible weekly opening hours",
  "description": "2 to 4 brand-story sentences written in a ${tone} voice",
  "promotions": "one tasteful offer appropriate to ${pricingTier} positioning, or empty string",
  "tone": "${tone}",
  "brandColor": "${brandColor || 'suggest a hex colour that complements this type of business'}",
  "pricingTier": "${pricingTier}",
  "specialFeatures": ["zero or more of: vegan, dog, accessible, wifi, outdoor, parking, delivery, ordering, giftcard, loyalty"]
}`,
      },
    ],
  });

  return normalizeProfile(
    parseJsonObject(response.choices[0]?.message?.content),
    shopName,
    preferredTone,
    preferredColor,
    preferredPricing,
  );
}

module.exports = { generateBusinessProfile, normalizeProfile };
