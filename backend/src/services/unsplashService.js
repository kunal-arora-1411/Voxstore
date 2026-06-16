/**
 * photoService.js  (was unsplashService — now powered by Pexels)
 *
 * Fetches relevant, high-quality photos from the Pexels API for each image
 * slot in a generated site.
 *
 * FREE tier: 200 requests/hour, 20 000/month — no credit card required.
 * Get your key in ~2 min: https://www.pexels.com/api/
 *
 * Attribution: each photo must credit "Photographer on Pexels" — handled
 * automatically in the generated site footer.
 */

const PEXELS_API = 'https://api.pexels.com/v1';

// --------------------------------------------------------------------------
// Category detection
// Derives a meaningful search keyword from the business data so queries
// are relevant even when the shop name alone is vague ("Mike's Place").
// --------------------------------------------------------------------------

const CATEGORY_HINTS = [
  { words: ['coffee', 'café', 'cafe', 'espresso', 'latte', 'brew', 'roast', 'tea'], category: 'coffee cafe shop' },
  { words: ['bakery', 'bread', 'pastry', 'cake', 'bake', 'sourdough', 'croissant'], category: 'artisan bakery bread' },
  { words: ['flower', 'floral', 'florist', 'bloom', 'bouquet', 'plant', 'botanical', 'succulent'], category: 'flower shop botanical' },
  { words: ['book', 'bookshop', 'bookstore', 'library', 'novel', 'reads'],           category: 'bookshop books' },
  { words: ['vintage', 'thrift', 'antique', 'retro', 'second-hand', 'preloved'],     category: 'vintage antique shop' },
  { words: ['jewel', 'jewelry', 'jewellery', 'ring', 'necklace', 'bracelet', 'gem'], category: 'jewelry boutique' },
  { words: ['fashion', 'cloth', 'apparel', 'wear', 'boutique', 'style', 'dress', 'shirt'], category: 'fashion boutique clothing' },
  { words: ['yoga', 'wellness', 'spa', 'meditation', 'pilates', 'fitness', 'gym'],   category: 'wellness yoga studio' },
  { words: ['art', 'gallery', 'studio', 'paint', 'canvas', 'craft', 'handmade'],    category: 'art studio gallery' },
  { words: ['food', 'restaurant', 'bistro', 'diner', 'kitchen', 'eat', 'meal'],     category: 'restaurant food' },
  { words: ['pet', 'dog', 'cat', 'grooming', 'paw', 'animal'],                      category: 'pet shop' },
  { words: ['hair', 'salon', 'barber', 'beauty', 'nail', 'lash'],                   category: 'beauty salon hair' },
  { words: ['candle', 'home', 'decor', 'interior', 'furniture', 'gift', 'lifestyle'], category: 'home decor lifestyle' },
];

function detectCategory(formData) {
  const haystack = [
    formData.shopName || '',
    formData.description || '',
    ...(formData.products || []),
  ].join(' ').toLowerCase();

  for (const hint of CATEGORY_HINTS) {
    if (hint.words.some((w) => haystack.includes(w))) {
      return hint.category;
    }
  }
  return 'small business shop';
}

// --------------------------------------------------------------------------
// Search query builders per slot
// --------------------------------------------------------------------------

function buildQueries(formData) {
  const category = detectCategory(formData);
  const products  = (formData.products || []).slice(0, 6);

  const queries = {
    hero:     `${category} storefront exterior`,
    'shop-1': `${category} interior cozy`,
    'shop-2': `${category} artisan craft detail`,
    'shop-3': `${category} team workspace`,
  };

  const productNames = products.length > 0
    ? products
    : ['signature item', 'customer favourite', 'new arrival'];

  productNames.slice(0, 6).forEach((p, i) => {
    queries[`product-${i + 1}`] = `${p} ${category}`;
  });

  return queries;
}

// --------------------------------------------------------------------------
// Core fetch — Pexels /v1/search
// --------------------------------------------------------------------------

async function fetchPexelsPhoto(query, orientation = 'landscape') {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const params = new URLSearchParams({ query, per_page: 1, orientation });

  const res = await fetch(`${PEXELS_API}/search?${params}`, {
    headers: { Authorization: key },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pexels API ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const photo = data?.photos?.[0];
  if (!photo) throw new Error('Pexels: no photos returned for query: ' + query);

  // Use large2x (1880px) for hero/shop; large (940px) for products
  const url = orientation === 'squarish'
    ? (photo.src?.large  || photo.src?.original)
    : (photo.src?.large2x || photo.src?.original);

  return {
    url,
    photographer: photo.photographer || 'Pexels photographer',
    profileLink:  `${photo.photographer_url || 'https://www.pexels.com'}`,
    photoLink:    `${photo.url || 'https://www.pexels.com'}`,
  };
}

// --------------------------------------------------------------------------
// Public API
// buildPexelsImageMap(formData) → { slotKey: photoObj | absent }
// --------------------------------------------------------------------------

async function buildPexelsImageMap(formData) {
  if (!process.env.PEXELS_API_KEY) {
    console.warn({ event: 'pexels_skip', reason: 'PEXELS_API_KEY not set — using SVG placeholders' });
    return {};
  }

  const queries = buildQueries(formData);
  const slots   = Object.keys(queries);

  const results = await Promise.allSettled(
    slots.map((slot) => {
      const orientation = slot.startsWith('product') ? 'square' : 'landscape';
      return fetchPexelsPhoto(queries[slot], orientation).then((photo) => ({ slot, photo }));
    })
  );

  const map = {};
  let fetchedCount = 0;
  let failedCount  = 0;

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.photo) {
      const { slot, photo } = result.value;
      map[slot] = photo;
      fetchedCount++;
    } else {
      failedCount++;
      if (result.status === 'rejected') {
        console.warn({ event: 'pexels_photo_failed', reason: result.reason?.message });
      }
    }
  }

  console.log({ event: 'pexels_fetch', fetchedCount, failedCount });
  return map;
}

// Keep the generic export name so openaiService.js needs no change
module.exports = { buildUnsplashImageMap: buildPexelsImageMap, detectCategory };
