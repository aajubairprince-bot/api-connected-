import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { getSupabaseConfig, getSupabaseAdminClient, localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);
  const config = getSupabaseConfig();

  if (req.method === 'POST') {
    const body = req.body || {};
    const doctorName = escapeHtml((body.doctor_name || '').trim());
    const appointmentTime = (body.appointment_time || '').trim();
    const hospitalClinic = escapeHtml((body.hospital_clinic || '').trim());
    const notes = escapeHtml((body.notes || '').trim());

    if (!doctorName || !appointmentTime) {
      return sendJsonError(res, 400, 'Doctor name and appointment time required');
    }

    let createdId = localDb.generateId();

    // 1. Persist in Supabase appointments table
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            user_id: userId,
            doctor_name: doctorName,
            hospital_clinic: hospitalClinic,
            appointment_time: appointmentTime,
            notes: notes,
            is_completed: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          createdId = data.id;
        } else if (error) {
          console.warn('[Supabase appointments insert warning]:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase appointments insert error]:', err.message);
      }
    }

    // 2. Persist in local store
    const item = {
      id: createdId,
      user_id: userId,
      doctor_name: doctorName,
      hospital_clinic: hospitalClinic,
      appointment_time: appointmentTime,
      notes,
      is_completed: false,
      created_at: Date.now() / 1000
    };
    localDb.appointments.unshift(item);

    return sendJsonResponse(res, 201, {
      success: true,
      item: {
        id: item.id,
        doctor_name: item.doctor_name,
        appointment_time: item.appointment_time,
        hospital_clinic: item.hospital_clinic
      }
    });
  }

  if (req.method === 'DELETE') {
    const id = parseInt(req.query?.id || req.url?.split('/').pop()?.split('?')[0], 10);
    
    if (config.is_configured) {
      try {
        const supabase = getSupabaseAdminClient();
        await supabase
          .from('appointments')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
      } catch (_) {}
    }

    const index = localDb.appointments.findIndex(a => a.id === id && String(a.user_id) === userId);
    if (index !== -1) localDb.appointments.splice(index, 1);

    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
