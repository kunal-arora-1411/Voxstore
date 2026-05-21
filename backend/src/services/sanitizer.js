const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'html', 'head', 'body', 'title', 'meta', 'style', 'script',
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'button',
  'section', 'header', 'footer', 'nav', 'main', 'article', 'aside',
  'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'strong', 'em', 'b', 'i', 'br', 'hr',
  '!DOCTYPE',
];

const ALLOWED_ATTRS = {
  '*':    ['style', 'class', 'id', 'data-*'],
  a:      ['href', 'title', 'target', 'rel'],
  img:    ['src', 'alt', 'width', 'height', 'loading'],
  meta:   ['charset', 'name', 'content', 'viewport'],
  script: ['type'],
  td:     ['colspan', 'rowspan'],
  th:     ['colspan', 'rowspan', 'scope'],
};

function sanitize(html) {
  if (!html || typeof html !== 'string') {
    throw new Error('Sanitizer received empty or non-string HTML');
  }

  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    allowedSchemes: ['https', 'data'],
    allowedSchemesByTag: { img: ['https', 'data'] },
    allowVulnerableTags: true, // needed to allow <script> and <style>
    // Block on* event handler attributes; allow <script> blocks for animations
    exclusiveFilter: (frame) => {
      const attrs = frame.attribs || {};
      for (const key of Object.keys(attrs)) {
        if (key.startsWith('on')) return true; // strip onclick, onmouseover, etc.
      }
      return false;
    },
  });

  if (!clean || clean.trim().length < 50) {
    throw new Error('Sanitized HTML is too short — generation likely failed');
  }

  return clean;
}

module.exports = { sanitize };
