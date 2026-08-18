import { sendJsonError } from '../../lib/errors.js';

export default async function handler(req, res) {
  // Simulates a structured 500 error without exposing stack trace
  sendJsonError(res, 500, 'An unexpected server error occurred. Our engineers have been alerted.');
}
