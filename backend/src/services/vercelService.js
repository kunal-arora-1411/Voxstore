const axios = require('axios');

const VERCEL_API = 'https://api.vercel.com';
const TOKEN = () => process.env.VERCEL_TOKEN;
const TEAM_ID = () => process.env.VERCEL_TEAM_ID;

function headers() {
  return { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' };
}
function teamParam() {
  return TEAM_ID() ? `?teamId=${TEAM_ID()}` : '';
}
async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Builds the files array for the Vercel deployment.
 * html: sanitized HTML string
 * formData: validated form data (contains logoImage, heroImage, shopPhotos, productPhotos)
 * imageFileMap: { 'images/hero.jpg': 'hero', ... } from promptBuilder
 */
function buildFilesList(html, formData, imageFileMap) {
  const files = [
    {
      file: 'index.html',
      data: Buffer.from(html).toString('base64'),
      encoding: 'base64',
    },
  ];

  const { logoImage, heroImage, shopPhotos = [], productPhotos = {} } = formData;

  // Add each image file if it has data and is referenced in the imageFileMap
  if (logoImage?.data && imageFileMap['images/logo.jpg']) {
    files.push({ file: 'images/logo.jpg', data: logoImage.data, encoding: 'base64' });
  }
  if (heroImage?.data && imageFileMap['images/hero.jpg']) {
    files.push({ file: 'images/hero.jpg', data: heroImage.data, encoding: 'base64' });
  }
  shopPhotos.forEach((photo, i) => {
    const path = `images/shop-${i + 1}.jpg`;
    if (photo?.data && imageFileMap[path]) {
      files.push({ file: path, data: photo.data, encoding: 'base64' });
    }
  });
  Object.entries(productPhotos).forEach(([name, photo]) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    const path = `images/product-${slug}.jpg`;
    if (photo?.data && imageFileMap[path]) {
      files.push({ file: path, data: photo.data, encoding: 'base64' });
    }
  });

  return files;
}

async function deploy(html, siteId, formData, imageFileMap, attempt = 1) {
  const projectName = `voxstore-${siteId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const files = buildFilesList(html, formData, imageFileMap);

  console.log({ event: 'vercel_deploy_start', siteId, fileCount: files.length });

  try {
    const { data } = await axios.post(
      `${VERCEL_API}/v13/deployments${teamParam()}`,
      { name: projectName, files, projectSettings: { framework: null }, target: 'production' },
      { headers: headers() }
    );

    const deployId = data.id;
    const url = `https://${data.url}`;
    console.log({ event: 'vercel_deploy_created', deployId, url });

    const readyUrl = await pollUntilReady(deployId);
    return { deployId, url: readyUrl || url };
  } catch (err) {
    if (attempt < 3) {
      await sleep(1000 * Math.pow(2, attempt - 1));
      return deploy(html, siteId, formData, imageFileMap, attempt + 1);
    }
    throw new Error(`Vercel deploy failed after 3 attempts: ${err.message}`);
  }
}

async function pollUntilReady(deployId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(3000);
    try {
      const { data } = await axios.get(
        `${VERCEL_API}/v13/deployments/${deployId}${teamParam()}`,
        { headers: headers() }
      );
      console.log({ event: 'vercel_poll', deployId, state: data.readyState, attempt: i + 1 });
      if (data.readyState === 'READY') return `https://${data.url}`;
      if (data.readyState === 'ERROR' || data.readyState === 'CANCELED') {
        throw new Error(`Vercel deployment ${data.readyState}`);
      }
    } catch (err) {
      if (err.message.includes('READY') || err.message.includes('ERROR')) throw err;
    }
  }
  throw new Error('Vercel deployment timed out after polling');
}

async function swapAlias(deployId, alias, attempt = 1) {
  try {
    await axios.post(
      `${VERCEL_API}/v2/deployments/${deployId}/aliases${teamParam()}`,
      { alias },
      { headers: headers() }
    );
    console.log({ event: 'vercel_alias_swapped', deployId, alias });
  } catch (err) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return swapAlias(deployId, alias, attempt + 1);
    }
    throw new Error(`Alias swap failed: ${err.message}`);
  }
}

module.exports = { deploy, pollUntilReady, swapAlias };
