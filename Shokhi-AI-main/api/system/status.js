import { sendJsonResponse } from '../../lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  sendJsonResponse(res, 200, {
    status: 'online',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    system: 'Shokhi AI Maternal Care Platform'
  });
}
