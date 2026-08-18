/**
 * Shokhi AI (সখী AI) — Local Development Server & Vercel Emulator
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Import serverless endpoint handlers
import healthHandler from './api/health.js';
import configHandler from './api/config.js';
import statusHandler from './api/system/status.js';
import voiceConfigHandler from './api/voice/config.js';
import voiceTtsHandler from './api/voice/tts.js';
import test500Handler from './api/debug/test_500.js';
import hospitalSearchHandler from './api/emergency/hospital_search.js';
import helplinesHandler from './api/emergency/helplines.js';
import emergencyLogHandler from './api/emergency/log.js';
import registerHandler from './api/auth/register.js';
import loginHandler from './api/auth/login.js';
import googleAuthHandler from './api/auth/google.js';
import meHandler from './api/auth/me.js';
import syncProfileHandler from './api/auth/sync_profile.js';
import profileHandler from './api/profile/index.js';
import chatIndexHandler from './api/chat/index.js';
import chatSessionsHandler from './api/chat/sessions.js';
import chatMessagesHandler from './api/chat/messages.js';
import chatDeleteHandler from './api/chat/delete.js';
import maternityOverviewHandler from './api/maternity/overview.js';
import maternityMealsHandler from './api/maternity/meals.js';
import maternityMoodHandler from './api/maternity/mood.js';
import maternityAppointmentsHandler from './api/maternity/appointments.js';
import maternityVitalsHandler from './api/maternity/vitals.js';
import maternityRoutinesHandler from './api/maternity/routines/toggle.js';
import maternityRoutinesResetHandler from './api/maternity/routines/reset.js';
import maternityKicksHandler from './api/maternity/kicks.js';
import maternityHydrationHandler from './api/maternity/hydration.js';
import maternityNamesHandler from './api/maternity/names.js';
import notificationsIndexHandler from './api/notifications/index.js';
import notificationsReadHandler from './api/notifications/read.js';
import notificationsDismissHandler from './api/notifications/dismiss.js';
import notificationsTriggerHandler from './api/notifications/trigger_eval.js';
import notificationsHistoryHandler from './api/notifications/history.js';
import adminMetricsHandler from './api/admin/metrics.js';
import adminAssignRoleHandler from './api/admin/assign_role.js';
import adminDeleteHandler from './api/admin/delete.js';
import multimodalUploadHandler from './api/multimodal/upload.js';
import speakHandler from './api/speak.js';
import docsHandler from './api/docs.js';

const PORT = parseInt(process.env.NODE_PORT || process.env.PORT || 3000, 10);
const WWW_DIR = path.resolve(process.cwd(), 'www');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8'
};

async function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({ raw: data });
      }
    });
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

export function createServerInstance() {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;
    req.query = Object.fromEntries(reqUrl.searchParams.entries());
    req.body = await parseBody(req);

    // -------------------------------------------------------------
    // 🌐 API Routing Dispatcher
    // -------------------------------------------------------------
    try {
      if (pathname === '/api/health') return await healthHandler(req, res);
      if (pathname === '/api/config') return await configHandler(req, res);
      if (pathname === '/api/system/status') return await statusHandler(req, res);
      if (pathname === '/api/voice/config') return await voiceConfigHandler(req, res);
      if (pathname === '/api/voice/tts' || pathname === '/api/tts') return await voiceTtsHandler(req, res);
      if (pathname === '/api/debug/test_500') return await test500Handler(req, res);
      if (pathname === '/api/emergency/hospital_search') return await hospitalSearchHandler(req, res);
      if (pathname === '/api/emergency/helplines') return await helplinesHandler(req, res);
      if (pathname === '/api/emergency/log') return await emergencyLogHandler(req, res);
      
      if (pathname === '/api/auth/register') return await registerHandler(req, res);
      if (pathname === '/api/auth/login') return await loginHandler(req, res);
      if (pathname === '/api/auth/google') return await googleAuthHandler(req, res);
      if (pathname === '/api/auth/me') return await meHandler(req, res);
      if (pathname === '/api/auth/sync_profile') return await syncProfileHandler(req, res);

      if (pathname === '/api/profile') return await profileHandler(req, res);

      if (pathname === '/api/ask_prova_chat' || pathname === '/api/chat') return await chatIndexHandler(req, res);
      if (pathname === '/api/get_all_sessions' || pathname === '/api/chat/sessions') return await chatSessionsHandler(req, res);
      if (pathname.startsWith('/api/get_chat_messages/') || pathname === '/api/chat/messages') return await chatMessagesHandler(req, res);
      if (pathname.startsWith('/api/delete_chat_session/') || pathname === '/api/chat/delete') return await chatDeleteHandler(req, res);

      if (pathname === '/api/maternity/overview') return await maternityOverviewHandler(req, res);
      if (pathname === '/api/maternity/meals' || pathname.startsWith('/api/maternity/meals/')) return await maternityMealsHandler(req, res);
      if (pathname === '/api/maternity/mood' || pathname.startsWith('/api/maternity/mood/')) return await maternityMoodHandler(req, res);
      if (pathname === '/api/maternity/appointments' || pathname.startsWith('/api/maternity/appointments/')) return await maternityAppointmentsHandler(req, res);
      if (pathname === '/api/maternity/vitals' || pathname.startsWith('/api/maternity/vitals/')) return await maternityVitalsHandler(req, res);
      if (pathname === '/api/maternity/routines/toggle') return await maternityRoutinesHandler(req, res);
      if (pathname === '/api/maternity/routines/reset') return await maternityRoutinesResetHandler(req, res);
      if (pathname === '/api/maternity/kicks') return await maternityKicksHandler(req, res);
      if (pathname === '/api/maternity/hydration') return await maternityHydrationHandler(req, res);
      if (pathname === '/api/maternity/names' || pathname.startsWith('/api/maternity/names/')) return await maternityNamesHandler(req, res);

      if (pathname === '/api/notifications') return await notificationsIndexHandler(req, res);
      if (pathname.endsWith('/read')) return await notificationsReadHandler(req, res);
      if (pathname.endsWith('/dismiss')) return await notificationsDismissHandler(req, res);
      if (pathname === '/api/notifications/trigger_eval') return await notificationsTriggerHandler(req, res);
      if (pathname === '/api/notifications/history') return await notificationsHistoryHandler(req, res);

      if (pathname === '/api/admin/metrics') return await adminMetricsHandler(req, res);
      if (pathname === '/api/admin/assign_role' || pathname === '/api/admin/users/assign_admin' || pathname === '/api/admin/role') return await adminAssignRoleHandler(req, res);
      if (pathname === '/api/admin/delete') return await adminDeleteHandler(req, res);
      if (pathname === '/api/multimodal/upload') return await multimodalUploadHandler(req, res);
      if (pathname === '/api/speak') return await speakHandler(req, res);
      if (pathname === '/api/docs') return await docsHandler(req, res);

      // -------------------------------------------------------------
      // 📁 Static File Serving (www/, docs/, and uploads/)
      // -------------------------------------------------------------
      let targetFile = null;
      if (pathname === '/' || pathname === '/landing' || pathname === '/landing.html') {
        targetFile = 'landing.html';
      } else if (pathname === '/app' || pathname === '/index.html' || pathname === '/chat' || pathname === '/dashboard' || pathname === '/login' || pathname === '/register') {
        targetFile = 'index.html';
      } else if (pathname === '/admin' || pathname === '/admin.html') {
        targetFile = 'admin.html';
      } else if (pathname === '/docs' || pathname === '/docs/' || pathname === '/docs.html' || pathname === '/documentation') {
        targetFile = 'docs.html';
      }

      let filePath = targetFile ? path.join(WWW_DIR, targetFile) : path.join(WWW_DIR, pathname);
      if (pathname.startsWith('/uploads/') || (pathname.startsWith('/docs/') && pathname.endsWith('.md'))) {
        filePath = path.join(process.cwd(), pathname);
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.statusCode = 200;
        return fs.createReadStream(filePath).pipe(res);
      }

      // Fallback for single page app routing
      const fallbackPath = path.join(WWW_DIR, 'index.html');
      if (fs.existsSync(fallbackPath)) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.statusCode = 200;
        return fs.createReadStream(fallbackPath).pipe(res);
      }

      res.statusCode = 404;
      res.end('Not Found');
    } catch (err) {
      console.error('Server error:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  });
}

// Start standalone dev server on both port 3000 and 5000 when run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const server = createServerInstance();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Shokhi AI (Node.js Serverless Runtime) listening on http://127.0.0.1:${PORT}`);
  });

  // Also bind to port 5000 if different from PORT, so users visiting localhost:5000 get the Node app seamlessly
  if (PORT !== 5000) {
    const server5000 = createServerInstance();
    server5000.listen(5000, '0.0.0.0', () => {
      console.log(`🌸 Shokhi AI also mirroring on http://127.0.0.1:5000`);
    }).on('error', (err) => {
      console.log(`Note: Port 5000 in use or unavailable (${err.message})`);
    });
  }
}
