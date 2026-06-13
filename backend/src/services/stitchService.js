const { loadThemeDesign } = require('./themeDesignService');

let stitchSdkPromise = null;

function getStitchSdk() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error('Stitch is not configured. Add STITCH_API_KEY to the backend environment.');
  }

  if (!stitchSdkPromise) {
    stitchSdkPromise = import('@google/stitch-sdk').then(({ Stitch, StitchToolClient }) => {
      const client = new StitchToolClient({
        apiKey: process.env.STITCH_API_KEY,
        timeout: 300000,
      });
      return new Stitch(client);
    });
  }

  return stitchSdkPromise;
}

/**
 * Builds a CONCISE visual design brief for Stitch.
 *
 * Deliberately separate from promptBuilder.js — Stitch is a visual design
 * tool, not an engineering tool. It doesn't need CSS requirements, JS specs,
 * or output format rules. Keeping the prompt short (<3 000 chars) prevents
 * the "Incomplete API response / expected object at projection path" error
 * that occurs when the Stitch API receives an oversized request.
 */
function buildStitchPrompt(formData, imageFileMap = {}) {
  const {
    shopName, tagline, products = [], description, tone,
    brandColor, pricingTier, hours, address, promotions,
  } = formData;

  const toneGuide = {
    professional: 'formal, trustworthy, crisp — minimal decoration, sophisticated colour use, strong information hierarchy',
    friendly:     'warm, inviting, approachable — feels like a neighbourly local business, human and tactile',
    minimal:      'quiet, spacious, content-forward — generous whitespace, restrained palette, precise typography',
    bold:         'punchy, high-contrast, confident — oversized type, strong visuals, kinetic energy',
  };

  const pricingGuide = {
    budget:   'accessible, everyday value',
    midrange: 'fair price for quality craft',
    premium:  'luxury positioning — elevated, premium feel throughout',
  };

  // Build image reference list from the Pexels CDN URLs or local paths
  const imageLines = Object.entries(imageFileMap).map(([src, meta]) => {
    if (meta === 'hero')                                   return `  - Hero/banner: ${src}`;
    if (meta === 'logo')                                   return `  - Logo: ${src}`;
    if (typeof meta === 'string' && meta.startsWith('shop:'))    return `  - Shop photo (${meta.slice(5)}): ${src}`;
    if (typeof meta === 'string' && meta.startsWith('product:')) return `  - Product photo (${meta.slice(8)}): ${src}`;
    return `  - Image: ${src}`;
  });

  // Extract first two paragraphs of DESIGN.md (visual positioning only)
  let themeSnippet = '';
  try {
    const design = loadThemeDesign(tone);
    // Take the first 600 chars — enough for visual direction without overloading the prompt
    themeSnippet = design.slice(0, 600).replace(/#{1,6}\s/g, '').trim();
  } catch { /* non-fatal */ }

  const productList = (products.slice(0, 6)).map((p, i) => `  ${i + 1}. ${p}`).join('\n') ||
    '  (general retail — use best judgment)';

  return `Design a complete, beautiful landing page for a real deployed small-business website.

BUSINESS
  Name: ${shopName}${tagline ? `\n  Tagline: "${tagline}"` : ''}
  Brand colour: ${brandColor || '#2563eb'}
  Tone: ${toneGuide[tone] || toneGuide.friendly}
  Pricing: ${pricingGuide[pricingTier] || pricingGuide.midrange}
${description ? `  About: ${description.slice(0, 300)}` : ''}
${hours ? `  Hours: ${hours}` : ''}
${address ? `  Address: ${address}` : ''}
${promotions ? `  Promotion: ${promotions}` : ''}

PRODUCTS / SERVICES
${productList}

${imageLines.length > 0 ? `IMAGE ASSETS (use these exact URLs/paths as <img src> values)\n${imageLines.join('\n')}` : ''}

VISUAL DIRECTION (${tone})
${themeSnippet}

DESIGN REQUIREMENTS
- Full landing page: nav, hero with image, about/story, products, hours/contact, footer
- Hero: full-bleed photo background with overlay text — headline must be large and bold
- Use brand colour ${brandColor} for CTAs, accents, and key headings
- At least 3 distinct section layouts (asymmetric split, editorial grid, full-bleed strip)
- One dark-background section (footer or feature band)
- Product cards with hover effects; shop photos in a gallery layout
- Mobile responsive with clean breakpoints
- Smooth scroll-reveal animations
- Professional typographic scale — hero headline very large, body text readable
- Self-contained HTML + CSS + JS — no external CDN dependencies

OUTPUT: Return complete, valid HTML5 from <!DOCTYPE html> to </html> only. No commentary.`;
}

async function downloadHtml(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download Stitch HTML (${response.status})`);
  }

  const html = await response.text();
  if (!html || html.trim().length < 200) {
    throw new Error('Stitch returned an empty or incomplete HTML design.');
  }
  return html;
}

/**
 * Calls Stitch with up to `maxAttempts` retries before giving up.
 * Each retry creates a fresh screen so a malformed response from one
 * attempt doesn't poison the next.
 */
async function generateStitchDesign(formData, imageFileMap, maxAttempts = 3) {
  const stitch = await getStitchSdk();
  const title  = `VoxStore - ${formData.shopName}`.slice(0, 100);
  const prompt = buildStitchPrompt(formData, imageFileMap);

  console.log({
    event:       'stitch_attempt_start',
    promptChars: prompt.length,
    shopName:    formData.shopName,
    tone:        formData.tone,
  });

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Always create a fresh project per generation OR use the env-pinned project.
      // Reusing a project with concurrent calls can cause collisions — use a new
      // screen each time so the SDK state is clean.
      const project = process.env.STITCH_PROJECT_ID
        ? stitch.project(process.env.STITCH_PROJECT_ID)
        : await stitch.createProject(title);

      const screen  = await project.generate(prompt, 'DESKTOP');
      const htmlUrl = await screen.getHtml();
      const html    = await downloadHtml(htmlUrl);

      console.log({
        event:      'stitch_generation',
        projectId:  project.projectId,
        screenId:   screen.screenId,
        htmlLength: html.length,
        attempt,
      });

      return {
        html,
        projectId: project.projectId,
        screenId:  screen.screenId,
      };
    } catch (err) {
      lastError = err;
      console.warn({
        event:   'stitch_attempt_failed',
        attempt,
        message: err.message,
        willRetry: attempt < maxAttempts,
      });

      if (attempt < maxAttempts) {
        // Exponential backoff: 2s, 4s
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  // All attempts exhausted — throw so the caller can fall back gracefully
  throw new Error(`Stitch failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

module.exports = { buildStitchPrompt, generateStitchDesign };
