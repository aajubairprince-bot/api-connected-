import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { escapeHtml } from '../../lib/validation.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const userId = String(authUser.id);

  if (req.method === 'POST') {
    const body = req.body || {};
    const doctorName = escapeHtml((body.doctor_name || '').trim());
    const appointmentTime = (body.appointment_time || '').trim();
    const hospitalClinic = escapeHtml((body.hospital_clinic || '').trim());
    const notes = escapeHtml((body.notes || '').trim());

    if (!doctorName || !appointmentTime) {
      return sendJsonError(res, 400, 'Doctor name and appointment time required');
    }

    const item = {
      id: localDb.generateId(),
      user_id: userId,
      doctor_name: doctorName,
      hospital_clinic: hospitalClinic,
      appointment_time: appointmentTime,
      notes,
      is_completed: false,
      created_at: Date.now() / 1000
    };
    localDb.appointments.push(item);

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
    const index = localDb.appointments.findIndex(a => a.id === id && String(a.user_id) === userId);
    if (index === -1) {
      return sendJsonError(res, 404, 'Appointment not found');
    }
    localDb.appointments.splice(index, 1);
    return sendJsonResponse(res, 200, { success: true });
  }

  return sendJsonError(res, 405, 'Method Not Allowed');
}
