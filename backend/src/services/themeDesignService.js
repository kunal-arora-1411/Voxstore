const fs = require('fs');
const path = require('path');

const THEMES = new Set(['friendly', 'professional', 'minimal', 'bold']);
const cache = new Map();

function normalizeTheme(tone) {
  return THEMES.has(tone) ? tone : 'friendly';
}

function getThemeDesignPath(tone) {
  return path.join(__dirname, '..', '..', 'designs', normalizeTheme(tone), 'DESIGN.md');
}

function loadThemeDesign(tone) {
  const theme = normalizeTheme(tone);
  if (cache.has(theme)) return cache.get(theme);

  const designPath = getThemeDesignPath(theme);
  const design = fs.readFileSync(designPath, 'utf8').trim();
  if (!design) throw new Error(`Theme design file is empty: ${designPath}`);

  cache.set(theme, design);
  return design;
}

module.exports = { getThemeDesignPath, loadThemeDesign, normalizeTheme };
