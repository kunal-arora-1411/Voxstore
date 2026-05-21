/**
 * Builds OpenAI prompts from shop form data + image file map.
 * imageFiles: { 'images/hero.jpg': 'hero', 'images/product-espresso.jpg': 'product:Espresso', ... }
 */
function buildPrompt(formData, imageFiles = {}) {
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

  const systemPrompt = `You are an elite web designer building a real, live business website deployed to Vercel.

OUTPUT FORMAT — non-negotiable:
1. Return ONLY raw HTML. No markdown, no code fences, no commentary before or after.
2. ALL CSS goes inside one <style> block in <head>. Use CSS custom properties for brand colour.
3. ALL JavaScript goes inside one <script> block at the very end of <body>, before </body>.
4. ZERO external CDN links, ZERO Google Fonts imports, ZERO external scripts or stylesheets.
5. Use provided image files with exact paths e.g. <img src="images/hero.jpg">.
6. Valid HTML5: complete document from <!DOCTYPE html> to </html>.

DESIGN STANDARD:
- Looks like a $5,000 custom website — not a template, not generic.
- Mobile-first responsive with CSS Grid/Flexbox and @media (max-width: 768px) breakpoints.
- Rich colour use: brand colour in gradients, buttons, accents, section highlights, borders.
- Strong typographic hierarchy: large display headings, clear body text, monospace accents.
- Depth and texture: subtle background gradients, section colour blocking, layered shadows.

CSS REQUIREMENTS (all inside one <style> block):
- Define at top: --primary (brand colour), --primary-dark (darkened 15%), --primary-light (lightened/tinted),
  --bg (#ffffff or near-white), --bg-2 (subtle off-white section bg), --text (#111 or dark),
  --text-muted (#666), --radius (8px), --shadow (0 4px 24px rgba(0,0,0,0.08))
- Base: *, box-sizing: border-box; smooth scroll: html { scroll-behavior: smooth }
- @keyframes fadeUp  { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:none } }
- @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
- @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
- @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
- .reveal class: opacity:0; transform:translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease
- .reveal.is-visible: opacity:1; transform:none
- Cards: border-radius, box-shadow, transition transform 0.25s ease, box-shadow 0.25s ease
- Cards:hover: transform:translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.14)
- Buttons: border-radius 6px, padding, transition 0.2s, cursor pointer
- Buttons:hover: transform:translateY(-2px); box-shadow with brand colour glow
- Primary CTA button: background brand colour, white text, shimmer animation on hover
- Nav .scrolled class: background rgba(255,255,255,0.92), backdrop-filter:blur(12px), box-shadow
- Images: border-radius var(--radius); object-fit:cover; display:block
- img tags always have width/height or aspect ratio set to avoid layout shift
- Section padding: 80px 0 on desktop, 48px 0 on mobile
- Stagger animation delays for grids: .reveal:nth-child(2){transition-delay:0.1s} etc.

JAVASCRIPT REQUIREMENTS (one <script> block at end of <body>):
// 1. Scroll reveal via IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('is-visible') });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// 2. Sticky nav shadow on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// 3. Staggered hero entrance on load
window.addEventListener('load', () => {
  document.querySelectorAll('.hero-animate').forEach((el, i) => {
    el.style.animationDelay = (i * 0.18) + 's';
    el.classList.add('anim-running');
  });
});

// 4. Smooth scroll for all anchor links (CSS html{scroll-behavior:smooth} handles most, but JS for offsets)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});

SECTIONS (in order, all required):
1. <nav>   — sticky top, logo left + nav links right. Transparent at top, gains bg/blur on scroll (.scrolled).
             Mobile: hamburger or stacked menu. Nav links link to section IDs.
2. <section id="hero">
             Full-viewport or large (min-height:90vh). Hero image as background or <img> with overlay.
             Huge animated heading (.hero-animate). Tagline. CTA button (links to #products or #contact).
             Subtle floating element or animated shape for visual interest.
3. <section id="about">
             Brand story, 2–3 paragraphs. Special features as icon+label badge grid.
             .reveal on each element for scroll-in.
4. <section id="products">
             "Our [Products/Services/Menu/Offerings]" heading.
             Responsive CSS Grid (auto-fill, minmax(260px,1fr)).
             Each product card: image (or styled placeholder with brand colour), name, brief description.
             .reveal with stagger delays.
5. <section id="hours">
             Opening hours table/grid, styled beautifully.
             Address if provided. Any map placeholder or directions link.
6. <section id="contact">
             Phone, email, social links — styled as icon+text rows.
             If promotions provided, show as a highlighted banner.
7. <footer> — brand colour background, white text. Logo, copyright, social icons.
             Subtle top border or wave divider.

QUALITY CHECKLIST — every generated site must have:
✓ Hero heading animates in with fadeUp on page load
✓ All non-hero sections use .reveal class (IntersectionObserver triggers animation)
✓ Product/service cards have hover lift effect
✓ Nav gains background + blur when user scrolls past hero
✓ CTA button has shimmer or glow on hover
✓ Images all have object-fit:cover and sensible aspect ratios
✓ Site looks polished and professional at 375px (iPhone) width
✓ Brand colour is used richly — not just one accent, woven throughout`;

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
  Hero style: ${tone === 'bold' ? 'dark overlay on hero image, huge impactful white heading, punchy CTA' : tone === 'minimal' ? 'light, airy hero, refined typography, subtle brand colour accents' : 'warm welcoming hero, elegant heading, inviting CTA'}
  Card style: ${tone === 'minimal' ? 'clean cards with thin borders, minimal shadow' : 'elevated cards with generous shadow and rounded corners'}

Every section must be visually distinct. Use brand colour ${brandColor} generously.
The .reveal class goes on every card, heading, and paragraph outside the hero so they animate in on scroll.
Add .hero-animate to hero heading, tagline, and CTA button for staggered load animation.`;

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Derives the image file map from validated form data.
 */
function buildImageFileMap(formData) {
  const map = {};
  const { logoImage, heroImage, shopPhotos = [], productPhotos = {} } = formData;

  if (logoImage?.data) map['images/logo.jpg'] = 'logo';
  if (heroImage?.data)  map['images/hero.jpg'] = 'hero';

  shopPhotos.forEach((p, i) => {
    if (p?.data) map[`images/shop-${i + 1}.jpg`] = `shop:${p.label || `Shop photo ${i + 1}`}`;
  });

  Object.entries(productPhotos).forEach(([name, p]) => {
    if (p?.data) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      map[`images/product-${slug}.jpg`] = `product:${name}`;
    }
  });

  return map;
}

module.exports = { buildPrompt, buildImageFileMap };
