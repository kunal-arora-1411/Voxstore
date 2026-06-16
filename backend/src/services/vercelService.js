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
 * imageAssets: { 'images/hero.jpg': { data, encoding, meta }, ... }
 */
function buildFilesList(html, imageAssets = {}) {
  const files = [
    {
      file: 'index.html',
      data: Buffer.from(html).toString('base64'),
      encoding: 'base64',
    },
  ];

  Object.entries(imageAssets).forEach(([file, asset]) => {
    // Skip url-type assets — these are Unsplash CDN links embedded directly
    // as <img src="…"> in the HTML; they don't need to be uploaded to Vercel.
    if (asset?.encoding === 'url') return;
    if (asset?.data) {
      files.push({ file, data: asset.data, encoding: asset.encoding || 'base64' });
    }
  });

  return files;
}

async function deploy(html, siteId, imageAssets, attempt = 1) {
  const projectName = `voxstore-${siteId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const files = buildFilesList(html, imageAssets);

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
      return deploy(html, siteId, imageAssets, attempt + 1);
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

module.exports = { buildFilesList, deploy, pollUntilReady, swapAlias };
