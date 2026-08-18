/**
 * Hardened Gemini Generative AI Service for Shokhi AI (Node.js)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { escapeHtml } from './validation.js';
import dotenv from 'dotenv';
dotenv.config();

export const EMERGENCY_KEYWORDS_BN = [
  "রক্তপাত", "রক্তক্ষরণ", "পানি ভেঙেছে", "পানি ভাঙা", "তীব্র পেট ব্যথা",
  "প্রচণ্ড ব্যথা", "খিঁচুনি", "জ্ঞান হারিয়ে", "বাচ্চা নড়ছে না", "নড়াচড়া বন্ধ",
  "তীব্র জ্বর", "অতিরিক্ত রক্তচাপ", "চোখে ঝাপসা"
];

export const EMERGENCY_KEYWORDS_EN = [
  "heavy bleeding", "severe bleeding", "water broke", "leaking fluid",
  "severe abdominal pain", "acute pain", "convulsion", "seizure",
  "fainted", "unconscious", "no baby movement", "stopped moving",
  "high fever", "blurred vision", "extreme headache"
];

export const CLINICAL_DISCLAIMER_BN = "\n\n💡 *সতর্কতা: সখী একটি এআই সহায়ক। যেকোনো জরুরি অবস্থায় বা শারীরিক জটিলতায় অবিলম্বে নিকটস্থ হাসপাতাল বা রেজিস্টার্ড চিকিৎসকের পরামর্শ নিন।*";
export const CLINICAL_DISCLAIMER_EN = "\n\n💡 *Note: Shokhi is an AI companion. For any clinical emergencies or complications, please immediately consult a qualified healthcare provider.*";

export const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|system)\s+instructions/i,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
  /system\s+prompt\s+override/i,
  /reveal\s+your\s+(initial|system)\s+prompt/i,
  /bypass\s+safety\s+guidelines/i,
  /jailbreak/i
];

export function sanitizeUserPrompt(text, maxChars = 4000) {
  if (!text) return '';
  let clean = String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
  for (const pat of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(pat, '[filtered query pattern]');
  }
  clean = escapeHtml(clean);
  if (clean.length > maxChars) {
    clean = clean.substring(0, maxChars) + '... [truncated]';
  }
  return clean;
}

export function isEmergencyQuery(prompt, language = 'bn') {
  if (!prompt) return false;
  const pLower = prompt.toLowerCase();
  const keywords = language === 'bn' ? EMERGENCY_KEYWORDS_BN : EMERGENCY_KEYWORDS_EN;
  return keywords.some(kw => pLower.includes(kw.toLowerCase()));
}

export function getSystemInstruction(language = 'bn') {
  if (language === 'en') {
    return (
      "You are Shokhi (সখী), a deeply caring, knowledgeable, and empathetic pregnancy and maternity companion. " +
      "STRICT LANGUAGE INSTRUCTION: You MUST respond 100% in English. " +
      "Even if the user writes in Bengali or mixed language, reply completely in clean, natural, and fluent English. " +
      "Guidelines:\n" +
      "- Sound human, conversational, and comforting, like a trusted elder sister or caring healthcare companion.\n" +
      "- Avoid AI clichés like 'As an AI language model', 'Certainly!', or robotic bullet dumps.\n" +
      "- Give practical, medically grounded advice on nutrition, hydration, daily comfort, and emotional wellness during pregnancy.\n" +
      "- Keep answers clear, beautifully readable, and concise.\n" +
      "- For any emergency warning signs (severe bleeding, acute continuous pain, high fever, or sudden swelling), calmly and urgently advise consulting a doctor or hospital."
    );
  } else {
    return (
      "তুমি 'সখী' — গর্ভাবস্থা ও মাতৃত্বকালীন সময়ে একজন অত্যন্ত স্নেহময়ী, যত্নশীল ও বিশ্বস্ত বড় আপু বা ভালোবাসার সঙ্গী। " +
      "ভাষার কঠোর নিয়ম: তোমার পুরো উত্তরটি অবশ্যই ১০০% স্পষ্ট, প্রমিত ও সাবলীল বাংলায় হতে হবে। " +
      "ইউজার যদি ইংরেজিতেও প্রশ্ন করেন, তুমি উত্তর সম্পূর্ণ বাংলায় দেবে এবং সবসময় ইউজারকে আপন করে 'আপু' বলে সম্বোধন করবে। কোনো অবস্থাতেই ইংরেজি বাক্য ব্যবহার করবে না। " +
      "নির্দেশনাবলী:\n" +
      "- কোনো রোবোটিক বা কৃত্রিম ভাষা ব্যবহার করবে না। 'আমি একটি এআই' বা বইয়ের কঠিন বাক্য পরিহার করবে।\n" +
      "- গর্ভবতী মায়ের পুষ্টি, বিশ্রাম, মানসিক প্রশান্তি এবং যত্ন নিয়ে সহজ ও বাস্তবিক দেশীয় খাবারের পরামর্শ দেবে।\n" +
      "- গর্ভকালীন ভয় ও দুশ্চিন্তা দূর করে তাকে সাহস ও ভরসা দেবে।\n" +
      "- উত্তর সুন্দর, পরিষ্কার ও সহজে পড়ার মতো পরিমিত রাখবে।\n" +
      "- কোনো বিপদের লক্ষণ দেখলে শান্তভাবে দ্রুত ডাক্তার বা হাসপাতালে যাওয়ার পরামর্শ দেবে।"
    );
  }
}

export function buildUserStageContext(user = null, language = 'bn') {
  if (!user) return '';
  const week = user.pregnancy_week || 1;
  const blood = user.blood_group || 'অজানা';
  const allergies = user.allergies || 'নেই';
  
  let trimesterStr = '১ম ত্রৈমাসিক';
  if (week >= 14 && week <= 27) trimesterStr = '২য় ত্রৈমাসিক';
  else if (week >= 28) trimesterStr = '৩য় ত্রৈমাসিক';

  if (language === 'en') {
    return `\n[Mother's Gestational Context: Week ${week}, Trimester: ${trimesterStr}, Blood Group: ${blood}, Allergies: ${allergies}. Keep this stage in mind.]\n`;
  } else {
    return `\n[মায়ের গর্ভকালীন তথ্য: সপ্তাহ ${week}, ত্রৈমাসিক: ${trimesterStr}, রক্তের গ্রুপ: ${blood}, অ্যালার্জি: ${allergies}। এই অনুযায়ী যত্নশীল পরামর্শ দিন।]\n`;
  }
}

export function getOfflineFallback(prompt, language = 'bn') {
  const p = (prompt || '').toLowerCase();

  if (isEmergencyQuery(prompt, language)) {
    if (language === 'en') {
      return "🚨 **URGENT EMERGENCY ALERT:** The symptoms you described require immediate professional medical intervention. Please call 999 or Shastho Batayan (16263) immediately or visit the nearest emergency maternity hospital." + CLINICAL_DISCLAIMER_EN;
    }
    return "🚨 **জরুরি সতর্কবার্তা:** আপু, আপনার উল্লেখিত লক্ষণগুলো জরুরি চিকিৎসার সংকেত হতে পারে। আর একদম দেরি না করে দ্রুত নিকটস্থ হাসপাতালে যান অথবা ৯৯৯ বা ১৬২৬৩ (স্বাস্থ্য বাতায়ন)-এ ফোন করুন।" + CLINICAL_DISCLAIMER_BN;
  }

  // Smart Context-Aware Maternal Responses
  if (p.includes('বৃদ্ধি') || p.includes('ওজন') || p.includes('সপ্তাহ') || p.includes('growth') || p.includes('weight') || p.includes('24') || p.includes('২৪')) {
    if (language === 'en') {
      return "Hello sister! At 24 weeks (end of 2nd trimester), your baby is about the size of an ear of corn (around 30 cm long and weighing approx 600 grams). The baby's hearing is developing rapidly, and they can hear your voice and heartbeat. You will feel distinct kicks and movements now. Continue eating protein-rich foods, calcium, and iron to support this rapid growth phase." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, ২৪তম সপ্তাহে (২য় ট্রাইমেস্টারের শেষ দিকে) আপনার গর্ভের সোনামণি প্রায় একটি ভুট্টার সমান বড় (প্রায় ৩০ সে.মি. লম্বা ও ওজন প্রায় ৬০০ গ্রাম)। এই সময়ে বাচ্চার শ্রবণশক্তি তৈরি হয়ে যায়—সে আপনার কথা ও হৃৎস্পন্দন শুনতে পায়। আপনি এখন বাচ্চার স্পষ্ট নড়াচড়া ও লাথি অনুভব করতে পারবেন। বাচ্চার হাড় ও মস্তিষ্কের দ্রুত বিকাশের জন্য আপনার খাদ্যতালিকায় ডিম, দুধ, দেশি মাছ ও সবুজ শাকসবজি রাখুন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('মাথা') || p.includes('dizz') || p.includes('headache')) {
    if (language === 'en') {
      return "Hello sister, feeling slightly dizzy can happen during pregnancy due to hormonal changes or blood pressure fluctuations. Please sit or lie down on your left side immediately, drink a glass of clean water or fresh coconut water, and take deep gentle breaths. If the dizziness persists or is accompanied by severe headache or blurred vision, please consult your doctor immediately." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভাবস্থায় হরমোনের পরিবর্তন ও রক্তচাপের তারতম্যের কারণে হালকা মাথা ঘোরা হতে পারে। আপনি একটু শান্ত হয়ে বাম কাত হয়ে শুয়ে বিশ্রাম নিন এবং এক গ্লাস বিশুদ্ধ পানি বা ডাবের পানি পান করুন। খুব দ্রুত না উঠে ধীরে ধীরে ওঠাবসা করুন। যদি মাথা ঘোরা না কমে বা তীব্র মাথাব্যথা/চোখে ঝাপসা দেখেন, তবে দ্রুত ডাক্তারের পরামর্শ নিন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('খাবার') || p.includes('diet') || p.includes('খাব') || p.includes('food') || p.includes('ফল') || p.includes('meal') || p.includes('nutrition')) {
    if (language === 'en') {
      return "During pregnancy, aim for balanced, home-cooked nutritious meals:\n\n• **Protein:** Eggs, fresh fish, lentils (dal), milk, and yogurt for baby's tissue development\n• **Iron & Folic Acid:** Spinach, kachu shak, pomegranate, and bananas to prevent anemia\n• **Calcium:** Milk, paneer, and sesame for strong bones\n• **Hydration:** 2.5 to 3 liters of pure water daily\n\nAvoid unpasteurized dairy, raw or undercooked foods, and excess tea/coffee." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভাবস্থায় আপনার ও আপনার সোনামণির জন্য সেরা পুষ্টিকর খাবারগুলো হলো:\n\n• **প্রোটিন:** দিনে অন্তত ১টি ডিম, দেশি মাছ, ঘন ডাল, দুধ ও বাদাম\n• **আয়রন ও ফলিক এসিড:** লাল শাক, পালং শাক, কচু শাক, কাঁচকলা ও বেদানা (রক্তস্বল্পতা দূর করে)\n• **ক্যালসিয়াম ও ভিটামিন:** দুধ, দই, পেয়ারা, কমলা ও মাল্টা\n• **পর্যাপ্ত পানি:** দিনে আড়াই থেকে ৩ লিটার বিশুদ্ধ পানি\n\nকাঁচা বা আধা-সিদ্ধ খাবার এবং অতিরিক্ত চা-কফি পরিহার করুন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('পানি') || p.includes('hydrat') || p.includes('water')) {
    if (language === 'en') {
      return "Proper hydration is essential during pregnancy to maintain amniotic fluid, prevent constipation, and reduce urinary tract infections. Aim for 8 to 10 glasses (2.5–3 liters) of fluids daily. Fresh coconut water, light lemonade, and clear soups are great additions." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভকালীন সময়ে পর্যাপ্ত পানি পান অত্যন্ত জরুরি। এটি গর্ভের অ্যামনিওটিক ফ্লুইড ঠিক রাখতে, কোষ্ঠকাঠিন্য দূর করতে এবং ইউরিন ইনফেকশন প্রতিরোধ করতে সাহায্য করে। প্রতিদিন ৮-১০ গ্লাস (আড়াই থেকে ৩ লিটার) বিশুদ্ধ পানি, ডাবের পানি বা পাতলা লেবুর শরবত পান করুন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('পিঠ') || p.includes('কোমর') || p.includes('ক্লান্ত') || p.includes('ব্যথা') || p.includes('back') || p.includes('pain') || p.includes('fatigue')) {
    if (language === 'en') {
      return "Back pain and fatigue are common as your belly grows and posture shifts. To relieve discomfort:\n\n• Sleep on your left side with a supportive pillow between your knees\n• Avoid lifting heavy items or standing for long continuous periods\n• Wear comfortable, low-heeled footwear\n• Apply a warm compress to your lower back\n\nIf back pain is sharp, rhythmic, or accompanied by cramping/bleeding, contact your doctor right away." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভে বাচ্চা বড় হওয়ার সাথে সাথে পিঠে ও কোমরে চাপ পড়া এবং ক্লান্তি লাগা খুব সাধারণ। আরাম পাওয়ার জন্য:\n\n• ঘুমানোর সময় বাম কাত হয়ে দুই হাঁটুর মাঝে একটি নরম বালিশ দিয়ে ঘুমান\n• ভারী জিনিস তোলা বা দীর্ঘক্ষণ একটানা দাঁড়িয়ে থাকা এড়িয়ে চলুন\n• আরামদায়ক নরম জুতো ব্যবহার করুন\n• কোমরে হালকা গরম সেঁক দিতে পারেন\n\nব্যথা যদি খুব তীব্র হয় বা তলপেটে টান লাগে, তবে অবিলম্বে ডাক্তারের সাথে কথা বলুন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('আল্ট্রাসাউন্ড') || p.includes('ultrasound') || p.includes('স্ক্যান') || p.includes('scan') || p.includes('টেস্ট')) {
    if (language === 'en') {
      return "Standard pregnancy ultrasound schedule:\n\n• **6–8 Weeks:** Dating & viability scan (confirms heartbeat)\n• **18–22 Weeks:** Detailed anomaly scan (checks fetal anatomy & organ development)\n• **28–32 Weeks:** Growth & placental position scan\n• **36+ Weeks:** Final presentation & amniotic fluid assessment\n\nYour doctor may customize the schedule based on your individual health needs." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভাবস্থায় সাধারণত প্রয়োজনীয় আল্ট্রাসাউন্ড সময়সূচি:\n\n• **৬–৮ সপ্তাহ:** ডেটিং ও হার্টবিট স্ক্যান\n• **১৮–২২ সপ্তাহ:** অ্যানোমালি স্ক্যান (বাচ্চার অঙ্গপ্রত্যঙ্গের সঠিক গঠন পরীক্ষা)\n• **২৮–৩২ সপ্তাহ:** বাচ্চার বৃদ্ধি ও গর্ভফুলের অবস্থান (Growth Scan)\n• **৩৬+ সপ্তাহ:** প্রসবের আগের চূড়ান্ত পর্যবেক্ষণ\n\nআপনার চিকিৎসকের পরামর্শ অনুযায়ী নির্দিষ্ট তারিখে স্ক্যানটি সম্পন্ন করুন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('বমি') || p.includes('nausea') || p.includes('vomit')) {
    if (language === 'en') {
      return "Morning sickness is very common, especially in the first trimester. Try eating small, frequent meals rather than heavy ones. Keep dry crackers or toast by your bed in the morning, sip ginger water or lemonade, and stay well hydrated throughout the day." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, গর্ভকালীন প্রথম তিন মাসে বমি বমি ভাব বা 'মর্নিং সিকনেস' হওয়া স্বাভাবিক। এর জন্য সকালে ঘুম থেকে উঠেই শুকনা টোস্ট বা বিস্কুট খেতে পারেন। একেবারে পেট ভরে না খেয়ে অল্প অল্প করে বারবার খান। আদা চা বা লেবু পানি বমি ভাব কমাতে সাহায্য করে।" + CLINICAL_DISCLAIMER_BN;
  }

  if (p.includes('লাথি') || p.includes('নড়') || p.includes('kick') || p.includes('movement')) {
    if (language === 'en') {
      return "From week 24 onwards, fetal movement becomes more regular. After meals, you should feel around 10 distinct kicks or movements within 2 hours while lying comfortably on your left side. If you ever notice a sudden drop or absence of movement, consult your healthcare provider immediately." + CLINICAL_DISCLAIMER_EN;
    }
    return "আপু, ২৪ সপ্তাহের পর থেকে বাচ্চার নড়াচড়া বেশ নিয়মিত হয়ে ওঠে। সাধারণত খাবার খাওয়ার পর শান্ত হয়ে বাম কাতে শুয়ে ২ ঘণ্টার মধ্যে অন্তত ১০টি স্পষ্ট নড়াচড়া বা লাথি অনুভব করা স্বাভাবিক। যদি বাচ্চার নড়াচড়া হঠাৎ লক্ষণীয়ভাবে কমে যায়, তবে অবিলম্বে চিকিৎসকের পরামর্শ নিন।" + CLINICAL_DISCLAIMER_BN;
  }

  if (language === 'en') {
    return "Hello sister! I am right here with you as your loving maternity companion. Please take good care of yourself today—eat nourishing meals, stay well hydrated, and rest whenever you feel tired. How can I help you right now?" + CLINICAL_DISCLAIMER_EN;
  }
  return "হ্যালো আপু! আমি সখী, সবসময় আপনার পাশেই আছি। গর্ভকালীন এই সুন্দর সময়ে নিজের বিশেষ যত্ন নিন। নিয়মিত পুষ্টিকর খাবার খান, পর্যাপ্ত পানি পান করুন এবং হাসিখুশি থাকুন। আপনার আজকের অনুভূতি বা যেকোনো প্রশ্ন আমাকে জানাতে পারেন।" + CLINICAL_DISCLAIMER_BN;
}

export async function askGemini(promptText, history = [], options = {}) {
  const {
    language = 'bn',
    user = null,
    imageBytes = null,
    mimeType = 'image/jpeg',
    preferredModel = null
  } = options;

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return getOfflineFallback(promptText, language);
  }

  // Active production model pool tested for live API keys
  const defaultModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemma-4-31b-it'
  ];

  const modelsToTry = preferredModel 
    ? [preferredModel, ...defaultModels.filter(m => m !== preferredModel)]
    : defaultModels;

  const cleanPrompt = sanitizeUserPrompt(promptText);
  const sysInstruction = getSystemInstruction(language);
  const stageContext = buildUserStageContext(user, language);
  const isEmergency = isEmergencyQuery(cleanPrompt, language);

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: sysInstruction
      });

      let contents = [];
      // Add context and previous history
      if (stageContext) {
        contents.push({ role: 'user', parts: [{ text: stageContext }] });
        contents.push({ role: 'model', parts: [{ text: language === 'en' ? "Understood." : "বুঝেছি আপু।" }] });
      }

      for (const turn of history.slice(-6)) {
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }]
        });
      }

      const promptParts = [{ text: cleanPrompt }];
      if (imageBytes) {
        promptParts.push({
          inlineData: {
            data: Buffer.from(imageBytes).toString('base64'),
            mimeType: mimeType
          }
        });
      }

      contents.push({ role: 'user', parts: promptParts });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      let replyText = response.text() || '';

      if (isEmergency) {
        const alertPrefix = language === 'en'
          ? "🚨 **URGENT EMERGENCY ADVISORY:** Please immediately contact a doctor or hospital.\n\n"
          : "🚨 **জরুরি সতর্কবার্তা:** আপু, অবিলম্বে নিকটস্থ হাসপাতাল বা ডাক্তারের শরণাপন্ন হোন।\n\n";
        replyText = alertPrefix + replyText;
      }

      const disclaimer = language === 'en' ? CLINICAL_DISCLAIMER_EN : CLINICAL_DISCLAIMER_BN;
      if (!replyText.includes("সতর্কতা") && !replyText.includes("Note:")) {
        replyText += disclaimer;
      }

      return replyText;
    } catch (err) {
      console.warn(`[Gemini Node] Attempt with model '${modelName}' failed: ${err.message}`);
    }
  }

  return getOfflineFallback(cleanPrompt, language);
}
