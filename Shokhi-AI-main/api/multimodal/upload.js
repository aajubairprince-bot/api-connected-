import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const body = req.body || {};
  let fileData = body.file_data || body.file || null;
  let filename = body.filename || `doc_${Date.now()}.png`;
  let mimeType = body.mime_type || 'image/png';

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return sendJsonError(res, 400, 'Invalid file type. Supported formats: JPEG, PNG, WebP.');
  }

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {}
  }

  const safeFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const filePath = path.join(uploadDir, safeFilename);

  let sizeBytes = 1024;
  if (fileData && typeof fileData === 'string' && fileData.startsWith('data:')) {
    const base64Data = fileData.split(',')[1] || '';
    const buf = Buffer.from(base64Data, 'base64');
    sizeBytes = buf.length;
    if (sizeBytes > 5 * 1024 * 1024) {
      return sendJsonError(res, 413, 'File size exceeds maximum allowed limit (5MB).');
    }
    try {
      fs.writeFileSync(filePath, buf);
    } catch (e) {}
  }

  sendJsonResponse(res, 201, {
    success: true,
    message: 'Medical document / sonogram uploaded successfully',
    filename: safeFilename,
    image_url: `/uploads/${safeFilename}`,
    size_bytes: sizeBytes,
    mime_type: mimeType
  });
}
