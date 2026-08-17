from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from apscheduler.schedulers.background import BackgroundScheduler
import os
import json
import time
from gtts import gTTS
from google import genai
from google.genai import types

from dotenv import load_dotenv
load_dotenv()

# ১. Flask অ্যাপ ইনিশিয়ালাইজেশন ('www' ফোল্ডার ফ্রন্টএন্ড হিসেবে কাজ করবে)
app = Flask(__name__, static_folder='www', template_folder='www', static_url_path='')
CORS(app)

# ২. সিক্রেট কী ও SQLite ডেটাবেস কনফিগারেশন
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'prova_ai_secure_key_2026')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///prova_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------------------------------------------------
# 🤖 Gemini API কনফিগারেশন (.env ফাইল থেকে লোড হবে)
# -------------------------------------------------------------
def get_gemini_client():
    load_dotenv(override=True)
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        return None, None
    
    model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro').strip()
    try:
        client = genai.Client(api_key=api_key.strip())
        return client, model_name
    except Exception as e:
        print("Gemini client initialization error:", e)
        return None, model_name


# -------------------------------------------------------------
# 📊 ডেটাবেস মডেলসমূহ (অ্যাডমিন প্যানেলে দেখানোর জন্য)
# -------------------------------------------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    pregnancy_week = db.Column(db.Integer, default=1)

class ScheduledNotification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    schedule_time = db.Column(db.String(50), default="Everyday 09:00 AM")

class ChatLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.String(100))
    user_message = db.Column(db.Text)
    bot_response = db.Column(db.Text)
    timestamp = db.Column(db.Float, default=time.time)

# -------------------------------------------------------------
# 👑 অ্যাডমিন প্যানেল সেটআপ
# -------------------------------------------------------------
admin = Admin(app, name='PROVA AI Admin')
admin.add_view(ModelView(User, db))
admin.add_view(ModelView(ScheduledNotification, db))
admin.add_view(ModelView(ChatLog, db))

HISTORY_FILE = 'chat_history.json'

def load_all_history():
    if not os.path.exists(HISTORY_FILE):
        return {}
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return {}
            return data
    except Exception as e:
        print("Error loading history json:", e)
        return {}

def save_all_history(data):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print("Error saving history json:", e)

# -------------------------------------------------------------
# ⏰ ডেইলি অটোমেটিক নোটিফিকেশন সিডিউলার
# -------------------------------------------------------------
def send_daily_reminder():
    with app.app_context():
        print("🔔 [Daily Notification]: আপু, আজকের পানির টার্গেট ও ভিটামিন ওষুধ সময়মতো খেয়েছেন তো?")

scheduler = BackgroundScheduler()
scheduler.add_job(func=send_daily_reminder, trigger="cron", hour=9, minute=0)
scheduler.start()

# -------------------------------------------------------------
# 🌐 Web App Endpoints (API Routes)
# -------------------------------------------------------------

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/get_all_sessions', methods=['GET'])
def get_all_sessions():
    history = load_all_history()
    sessions = []
    
    if isinstance(history, dict):
        for chat_id, chat_data in history.items():
            if isinstance(chat_data, dict):
                sessions.append({
                    "chat_id": chat_id,
                    "title": chat_data.get("title", "Untitled Chat"),
                    "timestamp": chat_data.get("timestamp", 0)
                })
    sessions.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(sessions)

@app.route('/api/get_chat_messages/<chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    history = load_all_history()
    if isinstance(history, dict) and chat_id in history:
        return jsonify(history[chat_id].get("messages", []))
    return jsonify([])

@app.route('/api/ask_prova_chat', methods=['POST'])
def ask_prova_chat():
    data = request.json or {}
    chat_id = data.get('chat_id')
    prompt_text = data.get('prompt_text', '').strip()
    language = data.get('language', 'bn')
    requested_model = data.get('model') or request.args.get('model')

    if not prompt_text:
        return jsonify({"reply": "দয়া করে আপনার প্রশ্নটি লিখুন।" if language == 'bn' else "Please type your question."})

    history = load_all_history()
    if not isinstance(history, dict):
        history = {}
        
    if chat_id not in history:
        history[chat_id] = {
            "title": prompt_text[:25] + "..." if len(prompt_text) > 25 else prompt_text,
            "timestamp": time.time(),
            "messages": []
        }
    
    recent_history = history[chat_id]["messages"][-6:]
    history[chat_id]["messages"].append({"role": "user", "content": prompt_text})

    if language == 'en':
        system_prompt = (
            "You are Shokhi, a deeply caring, knowledgeable, and empathetic pregnancy and maternity companion. "
            "STRICT LANGUAGE INSTRUCTION: You MUST respond 100% in English. "
            "Even if the user writes in Bengali or mixed language, reply completely in clean, natural, and fluent English. "
            "Guidelines:\n"
            "- Sound human, conversational, and comforting, like a trusted elder sister or caring healthcare companion.\n"
            "- Avoid AI clichés like 'As an AI language model', 'Certainly!', or robotic bullet dumps.\n"
            "- Give practical, medically grounded advice on nutrition, hydration, daily comfort, and emotional wellness during pregnancy.\n"
            "- Keep answers clear, beautifully readable, and concise.\n"
            "- For any emergency warning signs (severe bleeding, acute continuous pain, high fever, or sudden swelling), calmly and urgently advise consulting a doctor or hospital."
        )
    else:
        system_prompt = (
            "তুমি 'সখী' — গর্ভাবস্থা ও মাতৃত্বকালীন সময়ে একজন অত্যন্ত স্নেহময়ী, যত্নশীল ও বিশ্বস্ত বড় আপু বা ভালোবাসার সঙ্গী। "
            "ভাষার কঠোর নিয়ম: তোমার পুরো উত্তরটি অবশ্যই ১০০% স্পষ্ট, প্রমিত ও সাবলীল বাংলায় হতে হবে। "
            "ইউজার যদি ইংরেজিতেও প্রশ্ন করেন, তুমি উত্তর সম্পূর্ণ বাংলায় দেবে এবং সবসময় ইউজারকে আপন করে 'আপু' বলে সম্বোধন করবে। কোনো অবস্থাতেই ইংরেজি বাক্য ব্যবহার করবে না। "
            "নির্দেশনাবলী:\n"
            "- কোনো রোবোটিক বা কৃত্রিম ভাষা ব্যবহার করবে না। 'আমি একটি এআই' বা বইয়ের কঠিন বাক্য পরিহার করবে।\n"
            "- গর্ভবতী মায়ের পুষ্টি, বিশ্রাম, মানসিক প্রশান্তি এবং যত্ন নিয়ে সহজ ও বাস্তবিক দেশীয় খাবারের পরামর্শ দেবে।\n"
            "- গর্ভকালীন ভয় ও দুশ্চিন্তা দূর করে তাকে সাহস ও ভরসা দেবে।\n"
            "- উত্তর সুন্দর, পরিষ্কার ও সহজে পড়ার মতো পরিমিত রাখবে।\n"
            "- কোনো বিপদের লক্ষণ দেখলে শান্তভাবে দ্রুত ডাক্তার বা হাসপাতালে যাওয়ার পরামর্শ দেবে।"
        )

    context_lines = []
    for msg in recent_history:
        sender = "User" if msg.get("role") == "user" else "Shokhi"
        context_lines.append(f"{sender}: {msg.get('content', '')}")
    
    conversation_context = "\n".join(context_lines)
    if conversation_context:
        prompt_with_context = f"Target Language: {'English' if language == 'en' else 'Bengali (বাংলা)'}\nPrevious conversation:\n{conversation_context}\n\nUser: {prompt_text}\nShokhi:"
    else:
        prompt_with_context = f"Target Language: {'English' if language == 'en' else 'Bengali (বাংলা)'}\nUser: {prompt_text}\nShokhi:"

    gemini_client, default_model = get_gemini_client()
    raw_model = requested_model or default_model or 'gemini-3.6-flash'

    if not gemini_client:
        if language == 'en':
            reply_text = "Please set your GEMINI_API_KEY in the .env file to enable AI responses."
        else:
            reply_text = "এআই রেসপন্স পেতে দয়া করে .env ফাইলে আপনার GEMINI_API_KEY যুক্ত করুন।"
    else:
        generation_config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            max_output_tokens=1500
        )
        
        reply_text = ""
        # Build smart candidate list prioritizing active Gemini models
        model_aliases = {
            'gemini-pro': 'gemini-3.1-pro-preview',
            'gemini-1.5-pro': 'gemini-3.1-pro-preview',
            'gemini-2.5-pro': 'gemini-3.1-pro-preview',
            'gemini-flash': 'gemini-3.6-flash',
            'gemini-1.5-flash': 'gemini-3.6-flash',
            'gemini-2.0-flash': 'gemini-3.6-flash',
            'gemini-2.5-flash': 'gemini-3.6-flash',
        }
        
        normalized_model = model_aliases.get(str(raw_model).lower(), raw_model)
        
        candidate_models = [normalized_model]
        for fallback in ['gemini-3.6-flash', 'gemini-3.1-pro-preview']:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        seen_models = set()
        for model in candidate_models:
            if not model or model in seen_models:
                continue
            seen_models.add(model)
            try:
                response = gemini_client.models.generate_content(
                    model=model,
                    contents=prompt_with_context,
                    config=generation_config
                )
                if response and response.text:
                    reply_text = response.text.strip()
                    break
            except Exception as model_err:
                print(f"Model '{model}' attempt failed: {model_err}")
                try:
                    combined_prompt = f"{system_prompt}\n\n{prompt_with_context}"
                    response = gemini_client.models.generate_content(
                        model=model,
                        contents=combined_prompt
                    )
                    if response and response.text:
                        reply_text = response.text.strip()
                        break
                except Exception as fallback_err:
                    print(f"Direct attempt with model '{model}' failed: {fallback_err}")

        if not reply_text:
            if language == 'en':
                reply_text = "I am here with you, but having a brief connection issue. Please try again in a moment."
            else:
                reply_text = "আপু, আমি আপনার সাথেই আছি, তবে সার্ভারের সাথে সাময়িক সংযোগ সমস্যা হচ্ছে। দয়া করে একটু পর আবার চেষ্টা করুন।"

    history[chat_id]["messages"].append({"role": "assistant", "content": reply_text})
    
    if history[chat_id]["title"] in ("Untitled Chat", "New Chat", "new chat") or "new chat" in history[chat_id]["title"].lower():
        history[chat_id]["title"] = prompt_text[:25] + "..." if len(prompt_text) > 25 else prompt_text
        
    save_all_history(history)

    try:
        chat_log = ChatLog(chat_id=chat_id, user_message=prompt_text, bot_response=reply_text)
        db.session.add(chat_log)
        db.session.commit()
    except Exception as e:
        print("Database save error:", e)

    return jsonify({"reply": reply_text})

@app.route('/api/speak', methods=['POST'])
def speak_text():
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    if not text:
        return "No text provided", 400
    
    try:
        is_bangla = any('\u0980' <= char <= '\u09FF' for char in text)
        tts_lang = 'bn' if is_bangla else 'en'
        tts = gTTS(text=text, lang=tts_lang, slow=False)
        audio_path = "temp_audio.mp3"
        tts.save(audio_path)
        return send_file(audio_path, mimetype="audio/mp3")
    except Exception as e:
        print("gTTS Error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(debug=True, port=port)