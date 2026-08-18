/**
 * Standardized JSON Error & Response Helper for Shokhi AI (Node.js/Vercel)
 */

export function sendJsonResponse(res, statusCode, data, headers = {}) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

export function sendJsonError(res, statusCode, message, errorType = null) {
  const defaultErrors = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error'
  };

  const error = errorType || defaultErrors[statusCode] || 'Error';
  const payload = {
    error,
    message,
    status_code: statusCode
  };

  sendJsonResponse(res, statusCode, payload, {
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
}
