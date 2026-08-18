import { sendJsonError } from '../../lib/errors.js';

// Fast In-Memory LRU Audio Cache
const audioCache = new Map();
const MAX_CACHE_ITEMS = 100;

function splitTextIntoSentences(text, maxChunkLen = 140) {
  // Split on Bengali dāri (।), exclamation (!), question (?), period (.), or newlines
  const rawSentences = text.split(/([।?!.\n]+)/);
  const result = [];
  let current = '';

  for (let i = 0; i < rawSentences.length; i++) {
    const part = rawSentences[i];
    if (!part) continue;

    if (current.length + part.length <= maxChunkLen) {
      current += part;
    } else {
      if (current.trim()) result.push(current.trim());
      current = part;
    }
  }
  if (current.trim()) result.push(current.trim());

  return result.length > 0 ? result : [text.substring(0, maxChunkLen)];
}

async function fetchAudioSegment(segment, lang) {
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(segment)}`;
  const res = await fetch(ttsUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://translate.google.com/'
    }
  });

  if (!res.ok) {
    throw new Error(`TTS provider returned HTTP ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  let text = '';
  let lang = 'bn';

  if (req.method === 'GET') {
    text = (req.query?.text || '').trim();
    lang = (req.query?.lang || 'bn').trim();
  } else {
    text = (req.body?.text || '').trim();
    lang = (req.body?.language || req.body?.lang || 'bn').trim();
  }

  if (!text) {
    return sendJsonError(res, 400, 'Text parameter is required.');
  }

  // Clean Markdown formatting, symbols, and bullets
  const cleanText = text
    .replace(/[*#_~`>•💡⚠️⚡🚨]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Auto-detect Bengali vs English
  const isBengali = /[\u0980-\u09FF]/.test(cleanText) || lang.startsWith('bn');
  const targetLang = isBengali ? 'bn' : 'en';

  const cacheKey = `${targetLang}:${cleanText}`;
  if (audioCache.has(cacheKey)) {
    const cachedBuffer = audioCache.get(cacheKey);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': cachedBuffer.length,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(cachedBuffer);
  }

  try {
    const segments = splitTextIntoSentences(cleanText, 140);
    const audioBuffers = await Promise.all(
      segments.map(seg => fetchAudioSegment(seg, targetLang).catch(err => null))
    );

    const validBuffers = audioBuffers.filter(Boolean);
    if (validBuffers.length === 0) {
      throw new Error('Could not synthesize any audio segments.');
    }

    const combinedBuffer = Buffer.concat(validBuffers);

    if (audioCache.size >= MAX_CACHE_ITEMS) {
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, combinedBuffer);

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': combinedBuffer.length,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(combinedBuffer);

  } catch (err) {
    console.error('[TTS Concatenation Error]:', err.message);
    return sendJsonError(res, 502, `Failed to stream speech audio: ${err.message}`);
  }
}
