import { sendJsonResponse } from '../../lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const query = req.query?.q || 'maternity hospital near me';
  const encodedQ = encodeURIComponent(query);

  sendJsonResponse(res, 200, {
    success: true,
    search_query: query,
    map_url: `https://www.google.com/maps/search/${encodedQ}/`
  });
}
