function slugify(value, fallback = 'item') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || fallback;
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function svgAsset(svg, meta) {
  return {
    data: Buffer.from(svg).toString('base64'),
    encoding: 'base64',
    meta,
  };
}

function initials(value) {
  return String(value || 'VS')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function buildLogoSample(formData) {
  const name = escapeXml(formData.shopName || 'Your Shop');
  const mark = escapeXml(initials(formData.shopName));
  const color = formData.brandColor || '#2563eb';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${color}"/>
      <stop offset="1" stop-color="#111111"/>
    </linearGradient>
  </defs>
  <rect width="720" height="720" rx="156" fill="#f8f5ef"/>
  <circle cx="360" cy="292" r="190" fill="url(#logo-bg)"/>
  <circle cx="360" cy="292" r="158" fill="none" stroke="#ffffff" stroke-width="3" opacity=".54"/>
  <text x="360" y="348" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="154" font-weight="700" letter-spacing="-8">${mark}</text>
  <path d="M205 522H515" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
  <text x="360" y="594" text-anchor="middle" fill="#171513" font-family="Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="3">${name}</text>
</svg>`;
}

function buildHeroSample(formData) {
  const name = escapeXml(formData.shopName || 'Your Shop');
  const color = formData.brandColor || '#2563eb';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7efe4"/>
      <stop offset="1" stop-color="${color}" stop-opacity=".32"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#dff1f4"/>
      <stop offset="1" stop-color="#8fb4bb"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#sky)"/>
  <circle cx="1320" cy="170" r="90" fill="#fff" opacity=".72"/>
  <path d="M0 720L300 570 560 690 870 500 1160 650 1600 430V1000H0Z" fill="${color}" opacity=".14"/>
  <rect x="240" y="260" width="1120" height="590" rx="24" fill="#f9f5ee"/>
  <rect x="280" y="320" width="1040" height="105" rx="10" fill="${color}"/>
  <text x="800" y="390" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="54" font-weight="700">${name}</text>
  <rect x="310" y="455" width="420" height="335" rx="12" fill="url(#glass)"/>
  <rect x="870" y="455" width="420" height="335" rx="12" fill="url(#glass)"/>
  <rect x="745" y="455" width="110" height="395" rx="8" fill="#3f352f"/>
  <rect x="770" y="495" width="60" height="145" rx="5" fill="#afc9cd"/>
  <circle cx="812" cy="680" r="8" fill="#e8c884"/>
  <rect x="360" y="600" width="310" height="22" rx="11" fill="#fff" opacity=".72"/>
  <rect x="920" y="600" width="310" height="22" rx="11" fill="#fff" opacity=".72"/>
  <g fill="${color}">
    <circle cx="315" cy="260" r="18"/><circle cx="375" cy="260" r="18"/><circle cx="435" cy="260" r="18"/>
    <circle cx="1165" cy="260" r="18"/><circle cx="1225" cy="260" r="18"/><circle cx="1285" cy="260" r="18"/>
  </g>
  <rect y="850" width="1600" height="150" fill="#d5c3ac"/>
  <text x="800" y="950" text-anchor="middle" fill="#493c34" font-family="Arial, sans-serif" font-size="26" letter-spacing="7">WELCOME IN</text>
</svg>`;
}

function buildShopSample(formData, index = 0) {
  const color = formData.brandColor || '#2563eb';
  const labels = ['THE SPACE', 'THE CRAFT', 'THE PEOPLE'];
  const label = labels[index % labels.length];
  const offsets = [0, 35, -30];
  const offset = offsets[index % offsets.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#f6efe5"/>
      <stop offset="1" stop-color="${color}" stop-opacity=".2"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#wall)"/>
  <rect y="650" width="1200" height="250" fill="#c9aa88"/>
  <rect x="${90 + offset}" y="100" width="430" height="390" rx="18" fill="#fff" opacity=".72"/>
  <rect x="${125 + offset}" y="135" width="360" height="320" rx="10" fill="#bdd5d8"/>
  <circle cx="${300 + offset}" cy="260" r="70" fill="#fff3cf" opacity=".9"/>
  <rect x="650" y="160" width="420" height="32" rx="16" fill="${color}"/>
  <rect x="690" y="235" width="340" height="18" rx="9" fill="#6c5a4b" opacity=".45"/>
  <rect x="690" y="280" width="300" height="18" rx="9" fill="#6c5a4b" opacity=".32"/>
  <rect x="690" y="325" width="325" height="18" rx="9" fill="#6c5a4b" opacity=".32"/>
  <rect x="590" y="525" width="500" height="95" rx="16" fill="#4b3b31"/>
  <rect x="630" y="620" width="28" height="180" fill="#4b3b31"/>
  <rect x="1020" y="620" width="28" height="180" fill="#4b3b31"/>
  <g fill="#f2d29a">
    <circle cx="700" cy="545" r="34"/><circle cx="785" cy="545" r="34"/><circle cx="870" cy="545" r="34"/>
  </g>
  <g fill="${color}">
    <rect x="130" y="680" width="150" height="20" rx="10"/>
    <rect x="920" y="710" width="170" height="20" rx="10"/>
  </g>
  <g fill="#4b3b31">
    <rect x="165" y="700" width="18" height="120"/><rect x="225" y="700" width="18" height="120"/>
    <rect x="960" y="730" width="18" height="90"/><rect x="1030" y="730" width="18" height="90"/>
  </g>
  <text x="1080" y="90" text-anchor="end" fill="${color}" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="6">${label}</text>
</svg>`;
}

function buildProductSample(formData, productName, index) {
  const color = formData.brandColor || '#2563eb';
  const name = escapeXml(productName || 'Featured Item');
  const rotations = [-8, 5, -3, 7, -6, 4];
  const rotation = rotations[index % rotations.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#fffaf3"/>
      <stop offset="1" stop-color="${color}" stop-opacity=".28"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="24" flood-opacity=".2"/></filter>
  </defs>
  <rect width="900" height="900" fill="url(#bg)"/>
  <circle cx="710" cy="170" r="120" fill="${color}" opacity=".12"/>
  <circle cx="160" cy="720" r="150" fill="#fff" opacity=".52"/>
  <g transform="translate(450 425) rotate(${rotation})" filter="url(#shadow)">
    <rect x="-220" y="-250" width="440" height="500" rx="46" fill="#fff"/>
    <rect x="-220" y="-250" width="440" height="135" rx="46" fill="${color}"/>
    <rect x="-220" y="-160" width="440" height="45" fill="${color}"/>
    <circle cx="0" cy="25" r="112" fill="${color}" opacity=".16"/>
    <path d="M-75 45C-20-80 75-72 92 15 110 110 15 145-75 45Z" fill="${color}"/>
    <path d="M-38 12C10-25 48-22 68 18" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round" opacity=".72"/>
    <rect x="-130" y="175" width="260" height="18" rx="9" fill="#493c34" opacity=".25"/>
  </g>
  <rect x="110" y="790" width="680" height="74" rx="37" fill="#fff" opacity=".84"/>
  <text x="450" y="839" text-anchor="middle" fill="#332923" font-family="Arial, sans-serif" font-size="34" font-weight="700">${name}</text>
</svg>`;
}

function buildUploadedAssets(formData) {
  const assets = {};
  const { logoImage, heroImage, shopPhotos = [], productPhotos = {} } = formData;

  if (logoImage?.data) {
    assets['images/logo.jpg'] = { data: logoImage.data, encoding: 'base64', meta: 'logo' };
  }
  if (heroImage?.data) {
    assets['images/hero.jpg'] = { data: heroImage.data, encoding: 'base64', meta: 'hero' };
  }

  shopPhotos.forEach((photo, index) => {
    if (photo?.data) {
      assets[`images/shop-${index + 1}.jpg`] = {
        data: photo.data,
        encoding: 'base64',
        meta: `shop:${photo.label || `Shop photo ${index + 1}`}`,
      };
    }
  });

  Object.entries(productPhotos).forEach(([name, photo]) => {
    if (photo?.data) {
      assets[`images/product-${slugify(name)}.jpg`] = {
        data: photo.data,
        encoding: 'base64',
        meta: `product:${name}`,
      };
    }
  });

  return assets;
}

/**
 * Creates a url-type asset entry for an Unsplash CDN image.
 * These are NOT uploaded to Vercel — they're referenced as external URLs in the HTML.
 */
function unsplashAsset(photo, meta) {
  return {
    url: photo.url,
    encoding: 'url',         // signal to vercelService to skip file upload
    meta,
    attribution: {
      photographer: photo.photographer,
      profileLink:  photo.profileLink,
      photoLink:    photo.photoLink,
    },
  };
}

/**
 * Builds fallback SVG sample assets for any slot NOT covered by Unsplash.
 * unsplashMap: { 'hero'|'shop-1'|'shop-2'|'shop-3'|'product-N': photoObj }
 */
function buildSampleAssets(formData, unsplashMap = {}) {
  const assets = {};
  const { logoImage, heroImage, shopPhotos = [], productPhotos = {} } = formData;

  // Logo — always SVG (Unsplash has no useful logo images)
  if (!logoImage?.data) {
    assets['images/sample-logo.svg'] = svgAsset(buildLogoSample(formData), 'logo');
  }

  // Hero
  if (!heroImage?.data) {
    if (unsplashMap['hero']) {
      assets['images/hero.jpg'] = unsplashAsset(unsplashMap['hero'], 'hero');
    } else {
      assets['images/sample-hero.svg'] = svgAsset(buildHeroSample(formData), 'hero');
    }
  }

  // Shop photos
  const shopLabels = ['Exterior and arrival', 'Interior and atmosphere', 'Team and craft'];
  const shopKeys   = ['shop-1', 'shop-2', 'shop-3'];
  shopLabels.forEach((label, index) => {
    if (!shopPhotos[index]?.data) {
      const key = shopKeys[index];
      if (unsplashMap[key]) {
        assets[`images/shop-${index + 1}.jpg`] = unsplashAsset(unsplashMap[key], `shop:${label}`);
      } else {
        assets[`images/sample-shop-${index + 1}.svg`] = svgAsset(
          buildShopSample(formData, index),
          `shop:${label}`
        );
      }
    }
  });

  // Product photos
  const products = (formData.products || []).slice(0, 6);
  const productNames = products.length ? products : ['Signature collection', 'Customer favourite', 'New arrival'];

  productNames.forEach((name, index) => {
    if (!productPhotos[name]?.data) {
      const key = `product-${index + 1}`;
      if (unsplashMap[key]) {
        assets[`images/product-${index + 1}-${slugify(name)}.jpg`] = unsplashAsset(
          unsplashMap[key],
          `product:${name}`
        );
      } else {
        assets[`images/sample-product-${index + 1}-${slugify(name)}.svg`] = svgAsset(
          buildProductSample(formData, name, index),
          `product:${name}`
        );
      }
    }
  });

  return assets;
}

function buildImageAssets(formData, unsplashMap = {}) {
  const uploadedAssets = buildUploadedAssets(formData);
  return { ...uploadedAssets, ...buildSampleAssets(formData, unsplashMap) };
}

function buildImageFileMap(imageAssets) {
  return Object.fromEntries(
    Object.entries(imageAssets).map(([path, asset]) => [path, asset.meta])
  );
}

/**
 * Extracts attribution data from all url-type (Unsplash) assets.
 * Returns an array of { photographer, profileLink, photoLink } objects.
 */
function buildAttributionList(imageAssets) {
  return Object.values(imageAssets)
    .filter((a) => a.encoding === 'url' && a.attribution)
    .map((a) => a.attribution);
}

module.exports = {
  buildImageAssets,
  buildImageFileMap,
  buildAttributionList,
  slugify,
};
