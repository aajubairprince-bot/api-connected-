/**
 * Shokhi AI — Automated Node.js / Vercel Serverless E2E Test Suite
 */

import http from 'http';
import { createServerInstance } from './server.js';
import dotenv from 'dotenv';
dotenv.config();

const TEST_PORT = 3199;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🚀 RUNNING NODE.JS / VERCEL SERVERLESS E2E PARITY TEST SUITE');
  console.log('='.repeat(70));

  const server = createServerInstance();
  await new Promise(resolve => server.listen(TEST_PORT, '127.0.0.1', resolve));
  console.log(`📡 Node test server running at ${BASE_URL}\n`);

  try {
    // 1. Health Check
    console.log('[Test Group 1: Health & System Diagnostics]');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'GET /api/health returned HTTP 200');
    assert(health.body.status === 'HEALTHY', 'Health status is HEALTHY');
    assert(health.body.subsystems?.maternal_context_engine === 'ACTIVE', 'Subsystem engines ACTIVE');

    const config = await request('GET', '/api/config');
    assert(config.status === 200, 'GET /api/config returned HTTP 200');

    const status = await request('GET', '/api/system/status');
    assert(status.status === 200 && status.body.status === 'online', 'GET /api/system/status online');

    const voiceCfg = await request('GET', '/api/voice/config');
    assert(voiceCfg.status === 200 && voiceCfg.body.success, 'GET /api/voice/config returned speech config');

    const test500 = await request('GET', '/api/debug/test_500');
    assert(test500.status === 500 && test500.body.error === 'Internal Server Error', 'GET /api/debug/test_500 returned structured JSON 500');

    // 2. Authentication & Cryptographic Isolation
    console.log('\n[Test Group 2: Authentication & Token Lifecycle]');
    const ts = Date.now();
    const userAEmail = `mother_a_${ts}@shokhiai.org`;
    const userBEmail = `mother_b_${ts}@shokhiai.org`;
    const adminEmail = `admin_${ts}@shokhiai.org`;

    const regA = await request('POST', '/api/auth/register', {
      email: userAEmail,
      password: 'SecurePassword123!',
      name: 'Nusrat Jahan',
      pregnancy_week: 14
    });
    assert(regA.status === 201 && regA.body.token, 'User A registered successfully with JWT');
    const tokenA = regA.body.token;

    const regB = await request('POST', '/api/auth/register', {
      email: userBEmail,
      password: 'SecurePassword123!',
      name: 'Fatema Khatun',
      pregnancy_week: 28
    });
    assert(regB.status === 201 && regB.body.token, 'User B registered successfully with JWT');
    const tokenB = regB.body.token;

    const regAdmin = await request('POST', '/api/auth/register', {
      email: adminEmail,
      password: 'AdminPassword123!',
      name: 'Dr. Defense Admin',
      is_admin: true
    });
    assert(regAdmin.status === 201 && regAdmin.body.user.is_admin, 'Admin registered successfully');
    const tokenAdmin = regAdmin.body.token;

    const loginA = await request('POST', '/api/auth/login', {
      email: userAEmail,
      password: 'SecurePassword123!'
    });
    assert(loginA.status === 200 && loginA.body.token, 'User A logged in successfully');

    const meA = await request('GET', '/api/auth/me', null, tokenA);
    assert(meA.status === 200 && meA.body.user.email === userAEmail, 'GET /api/auth/me verified claim identity');

    // 3. Gestational Profile Context
    console.log('\n[Test Group 3: Maternal Profile & Gestational Stage Calculation]');
    const profileA = await request('GET', '/api/profile', null, tokenA);
    assert(profileA.status === 200, 'GET /api/profile returned 200');
    assert(profileA.body.profile.gestational_metrics?.trimester === 2, 'Calculated Trimester 2 for week 14');

    const updateProfileA = await request('PUT', '/api/profile', {
      pregnancy_week: 30,
      blood_group: 'B+',
      allergies: 'Peanuts',
      emergency_contact_name: 'Rafiqul Islam',
      emergency_contact_phone: '+8801700000000'
    }, tokenA);
    assert(updateProfileA.status === 200, 'PUT /api/profile updated profile');
    assert(updateProfileA.body.profile.gestational_metrics?.trimester === 3, 'Calculated Trimester 3 for week 30');

    // 4. Conversational AI & Multi-Session Chat
    console.log('\n[Test Group 4: Conversational Chat & Red-Flag Triage]');
    const chatId = `chat_${ts}`;
    const chatTurn1 = await request('POST', '/api/ask_prova_chat', {
      chat_id: chatId,
      prompt_text: 'আপু, আমার হালকা মাথা ঘুরছে, কী করবো?',
      language: 'bn'
    }, tokenA);
    assert(chatTurn1.status === 200 && chatTurn1.body.reply, 'POST /api/ask_prova_chat returned empathetic AI response');

    const sessions = await request('GET', '/api/get_all_sessions', null, tokenA);
    assert(sessions.status === 200 && sessions.body.length >= 1, 'GET /api/get_all_sessions fetched chat session');

    const messagesA = await request('GET', `/api/get_chat_messages/${chatId}`, null, tokenA);
    assert(messagesA.status === 200 && messagesA.body.length >= 2, 'GET /api/get_chat_messages returned 2 turns for User A');

    // 5. Multi-Tenant Isolation Verification
    console.log('\n[Test Group 5: Cryptographic Multi-Tenant Isolation Audit]');
    const messagesB = await request('GET', `/api/get_chat_messages/${chatId}`, null, tokenB);
    assert(messagesB.status === 200 && messagesB.body.length === 0, 'User B CANNOT see User A messages (Zero data leak)');

    // 6. Maternal Health Tracker Persistence
    console.log('\n[Test Group 6: Maternal Health Tracker Logs]');
    const meal = await request('POST', '/api/maternity/meals', {
      meal_type: 'Lunch',
      description: 'Lentil soup, brown rice, spinach & boiled egg'
    }, tokenA);
    assert(meal.status === 201 && meal.body.success, 'POST /api/maternity/meals logged meal');

    const mood = await request('POST', '/api/maternity/mood', {
      entry_type: 'mood',
      label: 'Happy & Relaxed',
      severity: 'mild'
    }, tokenA);
    assert(mood.status === 201 && mood.body.success, 'POST /api/maternity/mood logged mood');

    const closeAppTime = new Date(Date.now() + 86400000 * 2).toISOString();
    const appointment = await request('POST', '/api/maternity/appointments', {
      doctor_name: 'Dr. Shahana Akter',
      appointment_time: closeAppTime,
      hospital_clinic: 'Square Hospital'
    }, tokenA);
    assert(appointment.status === 201 && appointment.body.success, 'POST /api/maternity/appointments scheduled visit');

    const vitals = await request('POST', '/api/maternity/vitals', {
      bp: '120/80',
      weight_kg: 62.5
    }, tokenA);
    assert(vitals.status === 201 && vitals.body.success, 'POST /api/maternity/vitals logged vitals');

    const routine = await request('POST', '/api/maternity/routines/toggle', {
      routine_key: 'Drink Water (2L)',
      is_completed: true
    }, tokenA);
    assert(routine.status === 200 && routine.body.is_completed, 'POST /api/maternity/routines/toggle checked habit');

    const kick = await request('POST', '/api/maternity/kicks', {
      kick_count: 10
    }, tokenA);
    assert(kick.status === 200 && kick.body.kick_count === 10, 'POST /api/maternity/kicks recorded 10 kicks');

    const kickReset = await request('POST', '/api/maternity/kicks', {
      reset: true
    }, tokenA);
    assert(kickReset.status === 200 && kickReset.body.kick_count === 0, 'POST /api/maternity/kicks reset kicks to 0');

    const hydrationLog = await request('POST', '/api/maternity/hydration', {
      glass_count: 6
    }, tokenA);
    assert(hydrationLog.status === 200 && hydrationLog.body.glass_count === 6, 'POST /api/maternity/hydration recorded 6 glasses');

    const hydrationReset = await request('POST', '/api/maternity/hydration', {
      reset: true
    }, tokenA);
    assert(hydrationReset.status === 200 && hydrationReset.body.glass_count === 0, 'POST /api/maternity/hydration reset glasses to 0');

    const routinesReset = await request('POST', '/api/maternity/routines/reset', {}, tokenA);
    assert(routinesReset.status === 200 && routinesReset.body.success, 'POST /api/maternity/routines/reset unchecked all routines');

    const name = await request('POST', '/api/maternity/names', {
      name: 'Anika',
      gender: 'girl',
      meaning: 'Graceful'
    }, tokenA);
    assert(name.status === 201 && name.body.success, 'POST /api/maternity/names bookmarked baby name');

    const overviewA = await request('GET', '/api/maternity/overview', null, tokenA);
    assert(overviewA.status === 200 && overviewA.body.meals.length >= 1, 'GET /api/maternity/overview populated for User A');

    const overviewB = await request('GET', '/api/maternity/overview', null, tokenB);
    assert(overviewB.status === 200 && overviewB.body.meals.length === 0, 'User B overview has 0 meals from User A (Zero cross-tenant leak)');

    // 7. Emergency Helplines & SOS Logging
    console.log('\n[Test Group 7: Emergency Helplines & Clinical Safety]');
    const helplines = await request('GET', '/api/emergency/helplines', null, tokenA);
    assert(helplines.status === 200 && helplines.body.helplines.national_emergency.number === '999', 'Helplines contain 999');
    assert(helplines.body.personal_emergency_contact.name === 'Rafiqul Islam', 'Personal emergency contact returned');

    const sosLog = await request('POST', '/api/emergency/log', {
      trigger_source: 'manual_sos',
      symptom_detected: 'Acute cramping'
    }, tokenA);
    assert(sosLog.status === 201 && sosLog.body.log_id, 'POST /api/emergency/log created emergency audit entry');

    // 8. Dynamic Care Notifications
    console.log('\n[Test Group 8: Notifications Engine & Evaluation]');
    const triggerEval = await request('POST', '/api/notifications/trigger_eval', {}, tokenA);
    assert(triggerEval.status === 200 && triggerEval.body.success, 'POST /api/notifications/trigger_eval evaluated reminders');

    const notifsA = await request('GET', '/api/notifications', null, tokenA);
    assert(notifsA.status === 200 && notifsA.body.notifications.length >= 1, 'GET /api/notifications returned notifications list');
    
    // Check if appointment reminder was evaluated
    const appNotif = notifsA.body.notifications.find(n => n.notification_type.startsWith('appointment'));
    assert(Boolean(appNotif), 'Proximity doctor appointment notification was successfully generated');

    const notifId = notifsA.body.notifications[0].id;
    const markRead = await request('POST', `/api/notifications/${notifId}/read`, {}, tokenA);
    assert(markRead.status === 200 && markRead.body.is_read, 'POST /api/notifications/:id/read marked as read');

    // 9. Admin Telemetry & Access Control
    console.log('\n[Test Group 9: Admin Telemetry & Authorization RBAC]');
    const adminMetrics = await request('GET', '/api/admin/metrics', null, tokenAdmin);
    assert(adminMetrics.status === 200 && adminMetrics.body.system_status === 'HEALTHY_OPERATIONAL', 'Admin retrieved metrics');

    const regularUserForbidden = await request('GET', '/api/admin/metrics', null, tokenA);
    assert(regularUserForbidden.status === 403, 'Regular user rejected with HTTP 403 Forbidden on admin endpoint');

    const promoteUserA = await request('POST', '/api/admin/assign_role', {
      email: userAEmail,
      is_admin: true
    }, tokenAdmin);
    assert(promoteUserA.status === 200 && promoteUserA.body.user.is_admin, 'Admin assigned admin role to User A');

    const demoteUserA = await request('POST', '/api/admin/assign_role', {
      email: userAEmail,
      is_admin: false
    }, tokenAdmin);
    assert(demoteUserA.status === 200 && !demoteUserA.body.user.is_admin, 'Admin revoked admin role from User A');

    // 10. Multimodal Upload & Voice TTS
    console.log('\n[Test Group 10: Multimodal Upload & Speech Synthesis]');
    const upload = await request('POST', '/api/multimodal/upload', {
      filename: 'ultrasound_test.png',
      mime_type: 'image/png'
    }, tokenA);
    assert(upload.status === 201 && upload.body.image_url, 'POST /api/multimodal/upload uploaded file');

    const speak = await request('POST', '/api/speak', {
      text: 'আপু, আপনার যত্ন নিন।'
    });
    assert(speak.status === 200 && speak.body.speech_synthesis?.engine === 'WebSpeechAPI', 'POST /api/speak synthesized speech config');

    // 11. Documentation Hub & Neural Audio Stream
    console.log('\n[Test Group 11: Documentation Hub & Audio Streaming]');
    const docsApi = await request('GET', '/api/docs');
    assert(docsApi.status === 200 && Array.isArray(docsApi.body.docs) && docsApi.body.docs.length > 0, 'GET /api/docs returned documentation directory');

    const ttsStream = await request('GET', '/api/voice/tts?lang=bn&text=হ্যালো');
    assert(ttsStream.status === 200, 'GET /api/voice/tts streamed audio/mpeg');

  } finally {
    server.close();
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 TEST RESULTS: Passed: ${passedCount} | Failed: ${failedCount}`);
  if (failedCount === 0) {
    console.log('🎉 ALL NODE.JS / VERCEL SERVERLESS TESTS PASSED WITH 100% SUCCESS! 🎉');
  } else {
    console.error('❌ SOME TESTS FAILED. PLEASE REVIEW ABOVE LOGS.');
    process.exit(1);
  }
  console.log('='.repeat(70));
}

runTests().catch(err => {
  console.error('Unhandled test execution error:', err);
  process.exit(1);
});
