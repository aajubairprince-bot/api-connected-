import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { checkRateLimit } from '../../lib/rateLimit.js';
import { askGemini, isEmergencyQuery } from '../../lib/gemini.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  const deviceId = req.headers['x-device-id'] || req.body?.device_id || 'guest_device_default';
  const userId = authUser ? String(authUser.id) : `guest_${deviceId}`;

  // Rate Limiting Check (25 RPM)
  const rateResult = checkRateLimit(`user_${userId}`, 25);
  if (!rateResult.allowed) {
    return sendJsonResponse(res, 429, {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before sending another prompt.',
      retry_after_seconds: rateResult.retryAfterSeconds
    });
  }

  const body = req.body || {};
  const chatId = body.chat_id || `chat_${Date.now()}`;
  const promptText = (body.prompt_text || '').trim();
  const language = body.language === 'en' ? 'en' : 'bn';
  const imageUrl = body.image_url || null;

  if (!promptText && !imageUrl) {
    return sendJsonError(res, 400, 'Prompt text or image is required.');
  }

  const rawTitle = promptText ? (promptText.length > 30 ? promptText.substring(0, 30) + '...' : promptText) : 'নতুন কথোপকথন';

  // 1. Fetch or create chat session in localDb
  let session = localDb.chat_sessions.find(s => s.id === chatId && String(s.user_id) === userId);
  if (!session) {
    session = {
      id: chatId,
      user_id: userId,
      title: rawTitle,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000
    };
    localDb.chat_sessions.unshift(session);
  } else {
    session.updated_at = Date.now() / 1000;
  }

  // 2. Fetch past messages for this session
  const history = localDb.chat_messages
    .filter(m => m.session_id === chatId && String(m.user_id) === userId)
    .sort((a, b) => a.created_at - b.created_at);

  // 3. Save User Turn in localDb
  const userMsg = {
    id: localDb.generateId(),
    session_id: chatId,
    user_id: userId,
    role: 'user',
    content: promptText,
    has_image: Boolean(imageUrl),
    image_url: imageUrl,
    created_at: Date.now() / 1000
  };
  localDb.chat_messages.push(userMsg);

  // 4. Fetch user profile for gestational context
  const dbUser = localDb.users.find(u => String(u.id) === userId) || authUser;

  // 5. Generate AI Response

  // 6. Generate AI Response
  let replyText = '';
  try {
    replyText = await askGemini(promptText, history, {
      language,
      user: dbUser,
      preferredModel: body.model
    });
  } catch (geminiErr) {
    console.warn('[Gemini Service Notice]:', geminiErr.message);
    replyText = getOfflineFallback(promptText, language);
  }

  // 7. Save Assistant Turn in localDb
  const aiMsg = {
    id: localDb.generateId(),
    session_id: chatId,
    user_id: userId,
    role: 'assistant',
    content: replyText,
    has_image: false,
    image_url: null,
    created_at: Date.now() / 1000
  };
  localDb.chat_messages.push(aiMsg);

  // 8. Automatic Emergency Red-Flag Audit Logging
  if (isEmergencyQuery(promptText, language)) {
    localDb.emergency_logs.push({
      id: localDb.generateId(),
      user_id: userId,
      trigger_source: 'chat_triage',
      symptom_detected: promptText.substring(0, 200),
      action_taken: 'Emergency advisory banner injected and hospital referral recommended',
      created_at: Date.now() / 1000
    });
  }

  // 9. Sync to Supabase PostgreSQL asynchronously in the background
  const supaConfig = getSupabaseConfig();
  if (supaConfig.is_configured) {
    (async () => {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase.from('chat_sessions').upsert({
          id: chatId,
          user_id: userId,
          title: session.title,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        await supabase.from('chat_messages').insert([
          {
            session_id: chatId,
            user_id: userId,
            role: 'user',
            content: promptText,
            has_image: Boolean(imageUrl),
            image_url: imageUrl,
            created_at: new Date().toISOString()
          },
          {
            session_id: chatId,
            user_id: userId,
            role: 'assistant',
            content: replyText,
            has_image: false,
            image_url: null,
            created_at: new Date().toISOString()
          }
        ]);
      } catch (e) {
        console.warn('[Supabase Sync Notice]:', e.message);
      }
    })().catch(() => {});
  }

  sendJsonResponse(res, 200, {
    reply: replyText,
    chat_id: chatId,
    title: session.title
  });
}
