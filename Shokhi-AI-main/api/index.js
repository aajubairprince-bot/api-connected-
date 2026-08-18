/**
 * 🌸 Shokhi AI — Consolidated Vercel Serverless Master Function (Single 1/12 Function Router)
 */
import { sendJsonError } from '../lib/errors.js';

// Import Handlers from handlers/
import healthHandler from '../handlers/health.js';
import configHandler from '../handlers/config.js';
import statusHandler from '../handlers/system/status.js';
import voiceConfigHandler from '../handlers/voice/config.js';
import voiceTtsHandler from '../handlers/voice/tts.js';
import test500Handler from '../handlers/debug/test_500.js';
import hospitalSearchHandler from '../handlers/emergency/hospital_search.js';
import helplinesHandler from '../handlers/emergency/helplines.js';
import emergencyLogHandler from '../handlers/emergency/log.js';
import registerHandler from '../handlers/auth/register.js';
import loginHandler from '../handlers/auth/login.js';
import googleAuthHandler from '../handlers/auth/google.js';
import meHandler from '../handlers/auth/me.js';
import syncProfileHandler from '../handlers/auth/sync_profile.js';
import profileHandler from '../handlers/profile/index.js';
import chatIndexHandler from '../handlers/chat/index.js';
import chatSessionsHandler from '../handlers/chat/sessions.js';
import chatMessagesHandler from '../handlers/chat/messages.js';
import chatDeleteHandler from '../handlers/chat/delete.js';
import maternityOverviewHandler from '../handlers/maternity/overview.js';
import maternityMealsHandler from '../handlers/maternity/meals.js';
import maternityMoodHandler from '../handlers/maternity/mood.js';
import maternityAppointmentsHandler from '../handlers/maternity/appointments.js';
import maternityVitalsHandler from '../handlers/maternity/vitals.js';
import maternityRoutinesHandler from '../handlers/maternity/routines/toggle.js';
import maternityRoutinesResetHandler from '../handlers/maternity/routines/reset.js';
import maternityKicksHandler from '../handlers/maternity/kicks.js';
import maternityHydrationHandler from '../handlers/maternity/hydration.js';
import maternityNamesHandler from '../handlers/maternity/names.js';
import notificationsIndexHandler from '../handlers/notifications/index.js';
import notificationsReadHandler from '../handlers/notifications/read.js';
import notificationsDismissHandler from '../handlers/notifications/dismiss.js';
import notificationsTriggerHandler from '../handlers/notifications/trigger_eval.js';
import notificationsHistoryHandler from '../handlers/notifications/history.js';
import adminMetricsHandler from '../handlers/admin/metrics.js';
import adminAssignRoleHandler from '../handlers/admin/assign_role.js';
import adminDeleteHandler from '../handlers/admin/delete.js';
import multimodalUploadHandler from '../handlers/multimodal/upload.js';
import speakHandler from '../handlers/speak.js';
import docsHandler from '../handlers/docs.js';

async function parseBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve(req.body || {});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({ raw: data });
      }
    });
    req.on('error', () => resolve(req.body || {}));
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Device-Id');
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname.replace(/\/$/, '') || '/api';
  req.query = Object.fromEntries(reqUrl.searchParams.entries());
  req.body = await parseBody(req);

  try {
    if (pathname === '/api/health' || pathname === '/api') return await healthHandler(req, res);
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
    if (pathname.startsWith('/api/get_chat_messages') || pathname === '/api/chat/messages') return await chatMessagesHandler(req, res);
    if (pathname.startsWith('/api/delete_chat_session') || pathname === '/api/chat/delete') return await chatDeleteHandler(req, res);

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

    return sendJsonError(res, 404, `Endpoint ${pathname} not found.`);
  } catch (err) {
    console.error('Serverless error:', err);
    return sendJsonError(res, 500, err.message || 'Internal Server Error');
  }
}
