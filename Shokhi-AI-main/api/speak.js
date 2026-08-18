import { sendJsonResponse, sendJsonError } from '../lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const body = req.body || {};
  const text = (body.text || '').trim();
  const requestedLang = body.language || '';

  if (!text) {
    return sendJsonError(res, 400, 'Text is required for speech synthesis.');
  }

  // Detect Bengali characters
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  const lang = requestedLang === 'en' ? 'en-US' : (hasBengali || requestedLang === 'bn' ? 'bn-BD' : 'en-US');

  // Strip Markdown symbols for clean voice narration
  const cleanNarration = text
    .replace(/[*#_~`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  sendJsonResponse(res, 200, {
    success: true,
    text: cleanNarration,
    speech_synthesis: {
      engine: 'WebSpeechAPI',
      lang: lang,
      gender: 'female',
      pitch: 1.25,
      rate: 0.95,
      voice_hints: lang === 'bn-BD' 
        ? ['bn-BD', 'bn-IN', 'Bangla', 'Bengali', 'female', 'Google বাংলা']
        : ['en-US', 'en-GB', 'Zira', 'Jenny', 'Samantha', 'Google US English', 'female']
    }
  });
}
