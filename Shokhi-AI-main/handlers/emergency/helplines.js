import { sendJsonResponse, sendJsonError } from '../../lib/errors.js';
import { verifyAuth } from '../../lib/auth.js';
import { localDb } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJsonError(res, 405, 'Method Not Allowed');
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return sendJsonError(res, 401, 'Authorization token required.');
  }

  const dbUser = localDb.users.find(u => String(u.id) === String(authUser.id));

  const helplines = {
    national_emergency: {
      number: "999",
      name_bn: "জাতীয় জরুরি সেবা (পুলিশ / অ্যাম্বুলেন্স / ফায়ার)",
      name_en: "National Emergency Service (Police / Ambulance / Fire)",
      type: "Toll Free (24/7)"
    },
    health_helpline: {
      number: "16263",
      name_bn: "স্বাস্থ্য বাতায়ন (২৪/৭ ডাক্তার টেলিমেডিসিন)",
      name_en: "Shastho Batayan (Doctor Telemedicine 24/7)",
      type: "Government Health Service"
    },
    maternal_child_helpline: {
      number: "109",
      name_bn: "নারী ও শিশু হেল্পলাইন",
      name_en: "Women & Children Support Helpline",
      type: "Toll Free (24/7)"
    },
    government_services: {
      number: "333",
      name_bn: "জাতীয় তথ্য ও সেবা",
      name_en: "National Information & Citizen Services",
      type: "Toll Free"
    }
  };

  let personalEmergencyContact = null;
  if (dbUser && (dbUser.emergency_contact_name || dbUser.emergency_contact_phone)) {
    personalEmergencyContact = {
      name: dbUser.emergency_contact_name || "Family Contact",
      phone: dbUser.emergency_contact_phone || ""
    };
  }

  sendJsonResponse(res, 200, {
    success: true,
    helplines,
    personal_emergency_contact: personalEmergencyContact,
    hospital_search_url: "https://www.google.com/maps/search/maternity+hospital+near+me/"
  });
}
