const { loadThemeDesign } = require('./themeDesignService');

/**
 * Builds OpenAI prompts from shop form data + image file map.
 * imageFiles: { 'images/hero.jpg': 'hero', 'images/product-espresso.jpg': 'product:Espresso', ... }
 */
function buildPrompt(formData, imageFiles = {}, attributionList = []) {
  const {
    shopName, tagline, products = [], hours, address, description, promotions,
    tone, brandColor, pricingTier,
    phone, email, website, instagram, facebook,
    specialFeatures = [],
  } = formData;

  const toneGuide = {
    professional: 'formal, trustworthy, polished — minimal decorative elements, sophisticated colour use',
    friendly:     'warm, approachable, conversational — feels like a neighbour, inviting and personal',
    minimal:      'clean, quiet, spacious — generous whitespace, restrained palette, content-forward',
    bold:         'punchy, high-contrast, confident — big typography, strong visuals, energetic layout',
  };

  const pricingGuide = {
    budget:   'affordable, value-focused, accessible to everyone',
    midrange: 'fair price for quality craftsmanship',
    premium:  'luxury, premium quality — price reflects genuine craft and expertise',
  };

  const featureLabels = {
    vegan: 'Vegan options', dog: 'Dog-friendly', accessible: 'Wheelchair accessible',
    wifi: 'Free WiFi', outdoor: 'Outdoor seating', parking: 'Free parking',
    delivery: 'Delivery available', ordering: 'Online ordering',
    giftcard: 'Gift cards available', loyalty: 'Loyalty program',
  };

  const imageLines = Object.entries(imageFiles).map(([path, meta]) => {
    if (meta === 'hero')    return `  - ${path} → hero/banner image (use prominently at top)`;
    if (meta === 'logo')    return `  - ${path} → shop logo (display in navbar/header)`;
    if (typeof meta === 'string' && meta.startsWith('shop:'))    return `  - ${path} → ${meta.slice(5)} photo`;
    if (typeof meta === 'string' && meta.startsWith('product:')) return `  - ${path} → photo for product "${meta.slice(8)}"`;
    return `  - ${path}`;
  });

  const systemPrompt = `You are a senior creative director and front-end engineer at a world-class digital agency. Every site you produce must look like it was billed at $15,000 and built by a team of specialists — not auto-generated.

═══════════════════════════════════════
OUTPUT FORMAT — strictly enforced
═══════════════════════════════════════
1. Return ONLY raw HTML. No markdown, no code fences, no commentary.
2. ALL CSS in one <style> block in <head>. ALL JS in one <script> block before </body>.
3. ZERO external CDN links, ZERO Google Fonts @import, ZERO external scripts.
4. Use provided image paths exactly as given (e.g. <img src="images/hero.jpg">).
   For Pexels/Unsplash CDN URLs use the full URL as the src value.
5. Valid HTML5 from <!DOCTYPE html> to </html>.
6. Max output: stay within token limits — prioritise CSS and layout richness.

═══════════════════════════════════════
TYPOGRAPHY SYSTEM
═══════════════════════════════════════
Define a clear typographic scale using system font stacks only:
  --font-serif:  Georgia, 'Times New Roman', serif;
  --font-sans:   -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  --font-mono:   'Courier New', Courier, monospace;

Scale (define as CSS custom properties):
  --text-xs: clamp(0.7rem, 1.5vw, 0.8rem)
  --text-sm: clamp(0.85rem, 1.8vw, 0.95rem)
  --text-base: clamp(1rem, 2vw, 1.1rem)
  --text-lg: clamp(1.1rem, 2.5vw, 1.35rem)
  --text-xl: clamp(1.3rem, 3vw, 1.7rem)
  --text-2xl: clamp(1.6rem, 4vw, 2.4rem)
  --text-3xl: clamp(2rem, 6vw, 3.8rem)
  --text-4xl: clamp(2.8rem, 8vw, 5.5rem)

Rules:
- Hero headline MUST use --text-4xl or --text-3xl with tight letter-spacing (-0.02em to -0.04em).
- Body copy uses --text-base or --text-sm with line-height 1.65–1.8.
- Subheadings use --text-2xl or --text-xl, NEVER the same size as body.
- Use font-weight contrast: 800/900 for hero, 600/700 for section headings, 400 for body.
- Mix serif and sans-serif deliberately: headline in serif + body in sans (or vice versa) based on the DESIGN.md tone.

═══════════════════════════════════════
LAYOUT SYSTEM
═══════════════════════════════════════
- Use CSS Grid for all multi-column layouts. Never use tables or floats.
- Outer wrapper: max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 5vw, 80px);
- Section vertical rhythm: padding: clamp(64px, 10vw, 140px) 0;
- Grid gaps: clamp(24px, 4vw, 56px)
- MANDATORY LAYOUTS — use at least 3 of these distinct grid patterns across the page:
  a) Asymmetric split: 2-column, 60/40 or 55/45, text one side, image other
  b) Magazine grid: 1 large hero card + 2 smaller side cards
  c) Masonry-feel: varying-height items in CSS Grid with align-items:start
  d) Full-bleed image strip with overlapping text card
  e) Horizontal scroll gallery (overflow-x:auto with snap) for shop/product photos
  f) Bento grid: mix of 1×1, 2×1, 1×2 cells using grid-column/row span

═══════════════════════════════════════
COLOUR SYSTEM
═══════════════════════════════════════
Derive all colours from --primary (brand colour). Never use a section with a plain flat background:
  --primary:       [brand colour]
  --primary-dark:  color-mix(in srgb, var(--primary) 70%, #000)  OR compute manually
  --primary-light: color-mix(in srgb, var(--primary) 15%, #fff)  OR compute manually
  --primary-muted: color-mix(in srgb, var(--primary) 8%, #fff)   OR compute manually
  --bg:            #ffffff (or warm near-white matching brand character)
  --bg-2:          a subtly tinted section background (NOT gray — derive from --primary-muted)
  --bg-dark:       #0f0f0f or deep brand-derived dark for footer/contrast sections
  --text:          #111 or #0f0f0f
  --text-muted:    #6b7280
  --border:        rgba(0,0,0,0.08)
  --radius:        [from DESIGN.md]
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)
  --shadow-md:     0 4px 16px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)
  --shadow-lg:     0 20px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)

Colour usage rules:
- At least ONE section must use --bg-dark (dark background with light text).
- The hero may use a semi-transparent gradient overlay on the image, not a flat colour block.
- Accent colour (--primary) appears on: CTAs, key headings, decorative lines, hover states, borders.
- NEVER paint full sections in the raw brand colour. Use it for accents, not backgrounds.

═══════════════════════════════════════
IMAGERY & PHOTO TREATMENT
═══════════════════════════════════════
Every image must be treated as a designed element, not just dropped in:

HERO IMAGE (mandatory):
  - Full-width or full-bleed: width:100vw or width:100%
  - Height: min(70vh, 700px) with object-fit:cover; object-position: center
  - Overlay: a subtle gradient (linear-gradient at 30–50% opacity max) for text legibility
  - Hero text overlaps the image — never floats below it on a white background

SHOP PHOTOS (atmosphere shots):
  - Display in a gallery or editorial layout — NOT a simple 3-column equal grid
  - At least one shop photo must span 2 grid columns or be taller than its neighbours
  - Use border-radius and overflow:hidden consistently; consider slight rotation (-1deg to 1deg) for organicity
  - aspect-ratio: 4/3 or 16/9 for landscape shots

PRODUCT IMAGES:
  - aspect-ratio: 1/1 (square) or 3/4 (portrait) — never unconstrained
  - Cards must have: a hover scale (transform:scale(1.03)), shadow lift, and a reveal of price/CTA
  - Product name below image in bold, description muted, price or CTA in brand colour

LOGO:
  - Show in nav (max-height: 44px) and footer (max-height: 56px)
  - Never stretch or distort — use object-fit:contain

═══════════════════════════════════════
SECTION-BY-SECTION MANDATES
═══════════════════════════════════════
NAVIGATION:
  - Sticky (position:fixed or position:sticky), starts transparent, gains background on scroll (.scrolled)
  - Logo left, nav links right (hidden on mobile behind a hamburger icon)
  - Mobile menu: full-screen or slide-in overlay with large touch targets (min 48px)
  - One primary CTA button in nav (e.g. "Order Now", "Book", "Shop") in --primary

HERO:
  - Full-viewport hero section (min-height: 100vh or 90vh) with real photo background
  - Headline: at least 2 lines, big and bold, uses --text-4xl
  - Tagline or subheading below in --text-lg, lighter weight
  - One or two CTA buttons: primary (filled, --primary) + optional secondary (ghost/outline)
  - At least one animated element: fadeUp on headline, floating badge, or scroll-down indicator

ABOUT / STORY section:
  - Must NOT be a centered paragraph of text. Use a split layout: text + image or text + stat grid
  - Include 2–3 "pillars" (key attributes of the business) displayed as distinct visual elements

PRODUCTS / SERVICES:
  - At minimum 3 product/service cards
  - Cards must NOT all look the same. Use at least 2 visual variants (e.g. featured card is larger)
  - Each card: photo, name, brief description (1–2 lines), and a CTA or price

TESTIMONIALS (if no real ones provided — omit this section entirely, do not invent fake ones):
  - Only include if the user provides real testimonial text

HOURS / LOCATION:
  - Style creatively: could be a split card with hours on left, a map placeholder or location card on right
  - Hours displayed in a clean table or grid — not a wall of plain text

FOOTER:
  - Dark background (--bg-dark), light text
  - 3–4 columns: brand/logo, navigation links, contact info, social links
  - Fine print + photo credits at the very bottom in small muted text

═══════════════════════════════════════
INTERACTION & ANIMATION
═══════════════════════════════════════
CSS Animations to define:
  @keyframes fadeUp   { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:none } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes slideInL { from { opacity:0; transform:translateX(-40px) } to { opacity:1; transform:none } }
  @keyframes slideInR { from { opacity:0; transform:translateX(40px) } to { opacity:1; transform:none } }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }

Scroll-reveal:
  .reveal { opacity:0; transform:translateY(32px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1) }
  .reveal.is-visible { opacity:1; transform:none }
  .reveal:nth-child(2) { transition-delay: 0.1s }
  .reveal:nth-child(3) { transition-delay: 0.2s }
  .reveal:nth-child(4) { transition-delay: 0.3s }

Hero entrance (.hero-animate): use fadeUp animation with staggered delays via JS
Hover states on ALL interactive elements: buttons, cards, nav links, social icons
Nav transition: background 0.3s ease, box-shadow 0.3s ease

═══════════════════════════════════════
STRICT ANTI-GENERIC CHECKLIST
═══════════════════════════════════════
❌ NO centered headline + centered paragraph hero
❌ NO identical-height, identical-width card grids repeated in every section
❌ NO emoji used as icons or decoration
❌ NO fake stats, awards, or fabricated social proof
❌ NO lorem ipsum or placeholder copy
❌ NO generic phrases: "quality you can trust", "we are passionate about", "your one-stop shop", "something for everyone"
❌ NO rainbow gradient backgrounds or gradient text on every element
❌ NO thin (1px) fonts on dark backgrounds — illegible
❌ NO images without object-fit:cover and explicit aspect-ratio
❌ NO mention of AI, Pexels, Stitch, or generated assets anywhere
❌ NO flat white nav that never changes on scroll
❌ NO footer that is just a single centered copyright line
❌ NO section that exists only as a heading + body text with no visual interest
❌ NO hamburger menu that requires JavaScript to work — use <input type="checkbox"> + CSS if needed

═══════════════════════════════════════
QUALITY GATES — all must pass
═══════════════════════════════════════
✅ Hero photo is full-bleed with a text overlay (not below the image)
✅ At least 3 distinctly different section layout patterns
✅ At least 1 dark-background section with high-contrast light text
✅ Typography uses at least 2 weights and 2 sizes clearly differentiated
✅ Every image has object-fit:cover, explicit aspect-ratio, and display:block
✅ Mobile layout at 375px is fully functional — no horizontal overflow, no tiny text
✅ Scroll-reveal animations on all cards and section headings
✅ Nav is sticky and gains glass-morphism blur on scroll
✅ All buttons have visible hover states (colour shift + transform or shadow)
✅ Product/service cards have hover: scale + shadow lift
✅ Footer is multi-column with dark background and brand info
✅ One distinctive visual motif or texture derived from the business identity`;

  const productList = products.slice(0, 20).map((p, i) => `    ${i + 1}. ${p}`).join('\n');

  const socialLines = [
    instagram && `  Instagram: @${instagram}`,
    facebook  && `  Facebook: ${facebook}`,
    website   && `  Website: ${website}`,
  ].filter(Boolean).join('\n');

  const contactLines = [
    phone && `  Phone: ${phone}`,
    email && `  Email: ${email}`,
  ].filter(Boolean).join('\n');

  const featureList = specialFeatures.map(id => featureLabels[id] || id).filter(Boolean).join(', ');
  const themeDesign = loadThemeDesign(tone);

  const userPrompt = `Design and build a complete animated website for this business:

BUSINESS DETAILS
  Name: ${shopName}${tagline ? `\n  Tagline: "${tagline}"` : ''}
  Brand colour: ${brandColor} (use as --primary throughout — buttons, headings, accents, gradients, footer bg)
  Tone: ${toneGuide[tone] || toneGuide.friendly}
  Pricing: ${pricingGuide[pricingTier] || pricingGuide.midrange}

PRODUCTS / SERVICES
${productList || '    (general retail — use your best judgment)'}

HOURS & LOCATION
  ${hours || 'Mon–Fri 9am–6pm'}${address ? `\n  ${address}` : ''}
${description  ? `\nABOUT\n  ${description}`    : ''}
${promotions   ? `\nPROMOTIONS\n  ${promotions}` : ''}
${featureList  ? `\nFEATURES & AMENITIES\n  ${featureList}` : ''}
${contactLines ? `\nCONTACT\n${contactLines}`    : ''}
${socialLines  ? `\nSOCIAL\n${socialLines}`       : ''}
${imageLines.length > 0 ? `\nIMAGE ASSETS (use exact paths in <img> tags):\n${imageLines.join('\n')}` : ''}

DESIGN DIRECTION
  Tone: ${toneGuide[tone] || toneGuide.friendly}
  Composition: ${tone === 'bold'
    ? 'kinetic editorial layout, oversized type, hard crops, high contrast, decisive rectangular geometry'
    : tone === 'minimal'
      ? 'quiet art direction, disciplined grid, extreme whitespace, precise typography, almost no decoration'
      : tone === 'professional'
        ? 'structured editorial system, crisp alignment, restrained surfaces, confident information hierarchy'
        : 'human and tactile, warm editorial storytelling, playful asymmetry, inviting image-led moments'}
  Signature idea: derive one visual motif from the business name or its main offering and repeat it subtly
  across section transitions, image framing, labels, and interaction details.

SELECTED THEME DESIGN SYSTEM
Use the DESIGN.md reference below as the primary visual authority for typography, spacing, layout,
component geometry, elevation, responsive behavior, and interaction style.
- Adapt the reference to this business; never mention or reproduce the reference brand, trademarks, or logos.
- The user's brand colour ${brandColor} replaces the reference's primary/accent brand colour.
- Use system-safe font substitutes because external fonts and CDNs are prohibited.
- Business details, accessibility, image paths, and output requirements override the reference if they conflict.

<design-md theme="${tone}">
${themeDesign}
</design-md>

Every section must be visually distinct without becoming disconnected. Use brand colour ${brandColor} intentionally.
The .reveal class goes on every card, heading, and paragraph outside the hero so they animate in on scroll.
Add .hero-animate to hero heading, tagline, and CTA button for staggered load animation.`;

  // Pexels attribution — required by Pexels API terms of service.
  // Only appended when real photos were fetched (attributionList is non-empty).
  const attributionInstruction = attributionList.length > 0
    ? `

PHOTO ATTRIBUTION (required — do not omit):
Add a small "photo-credits" div as the very last element inside <footer> (before </footer>),
or as a standalone element immediately before </body> if there is no <footer>.
Style it with: font-size: 11px; color: var(--text-muted); opacity: 0.6; text-align: center; padding: 8px 0;
Use this exact content (one line per photographer, as an inline list):
${attributionList.map((a) =>
  `  Photo by <a href="${a.profileLink}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">${a.photographer}</a> on <a href="${a.photoLink}" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Pexels</a>`
).join(' · ')}`
    : '';

  return { system: systemPrompt, user: userPrompt + attributionInstruction };
}

module.exports = { buildPrompt };
