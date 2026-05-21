const OpenAI = require('openai');
const { buildPrompt, buildImageFileMap } = require('./promptBuilder');

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateSite(formData, attempt = 1) {
  const imageFileMap = buildImageFileMap(formData);
  const { system, user } = buildPrompt(formData, imageFileMap);
  const promptLen = system.length + user.length;

  const start = Date.now();
  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.72,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = response.choices[0].message.content || '';
    const html = stripMarkdownFences(raw);
    const latencyMs = Date.now() - start;

    console.log({ event: 'ai_generation', promptLen, responseLen: html.length, latencyMs, attempt });
    return { html, imageFileMap };
  } catch (err) {
    if (attempt < 3) {
      await sleep(1000 * attempt);
      return generateSite(formData, attempt + 1);
    }
    throw new Error(`OpenAI generation failed after 3 attempts: ${err.message}`);
  }
}

function stripMarkdownFences(text) {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

module.exports = { generateSite };
