const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const isDummyKey = !apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '';

if (isDummyKey) {
  console.warn(
    'WARNING: GEMINI_API_KEY is not configured or is set to a placeholder. Image analysis will use mock simulation.'
  );
}

const genAI = isDummyKey ? null : new GoogleGenerativeAI(apiKey);

module.exports = genAI;
