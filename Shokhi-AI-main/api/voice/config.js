import { sendJsonResponse } from '../../lib/errors.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  sendJsonResponse(res, 200, {
    success: true,
    engine: 'WebSpeechAPI / Hybrid gTTS',
    speech_recognition: {
      supported_languages: {
        bn: 'bn-BD',
        en: 'en-US'
      },
      continuous: false,
      interim_results: true
    },
    speech_synthesis: {
      preferred_voice_bn: 'bn-BD',
      preferred_voice_en: 'en-US',
      preferred_gender: 'female',
      rate: 1.0,
      pitch: 1.05
    },
    multimodal_vision: {
      enabled: true,
      max_file_size_mb: 5,
      supported_formats: ['image/jpeg', 'image/png', 'image/webp']
    }
  });
}
