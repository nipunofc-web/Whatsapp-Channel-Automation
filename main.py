import os
import time
from datetime import datetime
import requests
from flask import Flask, request, jsonify
from threading import Thread
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
import atexit

# --- 🗄️ Database IDs ---
BIN_ID = "6a0b4598ee5a733b12dd43b0"
API_KEY = "$2a$10$OBbATu.0sP8Tp6aIpz.4/.5GDh89dJyKwTJfO9j88y2JrvefEFOVC"

# --- 🟢 OFFICIAL WHATSAPP CLOUD API CONFIGURATIONS ---
PHONE_NUMBER_ID = "1037234516150757"
META_ACCESS_TOKEN = "EAF8ZAQAuHmGIBRYecunM2R9okQuFMQS1l32drx0APGBFZAWJlvelVAFNlEtiSqV4AqZANVYyHaqEZAidk9PJL1zhu3O4BaBt7WRqmIreAITJfM9rAK5xZAyNmkp7n3nZAWT62hNzv1LDOuCkcZBNZADxqeuGeq0VF6vcOh0vr1dBdLoVZCL3fxHX343YRZC4AjZACnv4p2JRy9BHPu8gGCm4pUXW6IGxbswjQJOO25MT3r9nIGekZBibJ0Ua6tbZAN13ZBH2G78oPAu0yGZBn0zXzs23opZAXQZDZD"
WA_CHANNEL_JID = "120363413193872888@newsletter"  

ADMIN_NUMBER = "94743689803" 
VERIFY_TOKEN = "my_secret_bot_123" 

SL_TZ = pytz.timezone('Asia/Colombo')

# 🛠️ Interpreter Shutdown Error එක නැති කරන්න සකසන ලද Scheduler එක
scheduler = BackgroundScheduler(timezone=SL_TZ, daemon=True)
flask_app = Flask('')

# --- 🗄️ Database Functions ---
def load_db():
    url = f"https://api.jsonbin.io/v3/b/{BIN_ID}/latest"
    headers = {"X-Master-Key": API_KEY}
    try:
        r = requests.get(url, headers=headers)
        data = r.json().get("record", {})
        if "scheduler_status" not in data: data["scheduler_status"] = "started"
        if "schedule_times" not in data: data["schedule_times"] = ["06:30", "11:00", "16:15", "20:30"]
        if "saved_message" not in data: data["saved_message"] = "සුබ දවසක් පැටියෝ! 🌸✨"
        return data
    except Exception as e:
        print("Database load error:", e)
        return {"scheduler_status": "started", "schedule_times": ["06:30", "11:00", "16:15", "20:30"], "saved_message": "සුබ දවසක් පැටියෝ! 🌸✨"}

def save_db(data):
    url = f"https://api.jsonbin.io/v3/b/{BIN_ID}"
    headers = {"X-Master-Key": API_KEY, "Content-Type": "application/json"}
    try: 
        requests.put(url, headers=headers, json=data)
    except Exception as e: 
        print("Database save error:", e)

# --- ✉️ Official WhatsApp Message Sending (Cloud API) ---
def send_official_whatsapp_message(to_jid_or_num, text):
    url = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {META_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_jid_or_num,
        "type": "text",
        "text": {"preview_url": True, "body": text}
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()
    except Exception as e:
        print("Official API Failed to send:", e)
        return None

# --- ⏰ Scheduler Task ---
def job_trigger():
    try:
        db = load_db()
        if db.get("scheduler_status") == "stopped": return
        current_time = datetime.now(SL_TZ).strftime("%H:%M")
        saved_times = db.get("schedule_times", [])
        if current_time in saved_times:
            message_to_send = db.get("saved_message", "")
            if message_to_send:
                send_official_whatsapp_message(WA_CHANNEL_JID, message_to_send)
    except Exception as e:
        print("Error inside job trigger:", e)

def reload_scheduler_jobs():
    try:
        scheduler.remove_all_jobs()
        scheduler.add_job(job_trigger, 'cron', minute='*')
    except Exception as e:
        print("Error reloading jobs:", e)

def parse_time_string(time_str):
    time_str = time_str.strip().lower()
    try:
        in_time = datetime.strptime(time_str, "%I.%M%p")
        return in_time.strftime("%H:%M")
    except ValueError:
        try:
            in_time = datetime.strptime(time_str, "%I:%M%p")
            return in_time.strftime("%H:%M")
        except ValueError: 
            return None

# --- 🎮 Command Processor ---
def process_bot_command(command_text):
    command_text = command_text.strip()
    db = load_db()
    
    if command_text == ".start":
        db["scheduler_status"] = "started"
        save_db(db)
        return "✅ *Auto Scheduler එක සාර්ථකව සක්‍රීය කළා!*"
    elif command_text == ".stop":
        db["scheduler_status"] = "stopped"
        save_db(db)
        return "🛑 *Auto Scheduler එක තාවකාලිකව නැවැත්තුවا!*"
    elif command_text.startswith(".set "):
        time_raw_data = command_text.replace(".set ", "")
        raw_list = time_raw_data.split(",")
        parsed_times = []
        for t in raw_list:
            formatted_t = parse_time_string(t)
            if formatted_t: parsed_times.append(formatted_t)
            else: return f"❌ *වැරදි වෙලාවක්:* '{t}'\n(උදා: `.set 6.30am,11.00am` වගේ දාන්න)"
        if parsed_times:
            db["schedule_times"] = parsed_times
            save_db(db)
            reload_scheduler_jobs()
            return f"📅 *අලුත් වෙලාවන් සාර්ථකව සකස් කළා:*\n{', '.join(parsed_times)}"
    elif command_text.startswith(".add "):
        msg_content = command_text.replace(".add ", "").strip()
        if msg_content:
            db["saved_message"] = msg_content
            save_db(db)
            return "📝 *සෙඩියුල් මැසේජ් එක සාර්ථකව Update කළා!*"
    return None

# --- 🌐 Web Server & Meta Webhook Integration ---
@flask_app.route('/')
def home(): 
    return "Official WhatsApp Channel Scheduler Bot is Running Safely 24/7!"

@flask_app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        mode = request.args.get('hub.mode')
        token = request.args.get('hub.verify_token')
        challenge = request.args.get('hub.challenge')
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            print("Webhook Verified Successfully! 🎉")
            send_official_whatsapp_message(ADMIN_NUMBER, "🚀 *Bot Connection Successful!*\n\nඔයාගේ සෙඩියුලර් බොට් නිල WhatsApp Cloud API එකත් එක්ක සාර්ථකව සම්බන්ධ වුණා මගේ මැණික. 🥰✨")
            return challenge, 200
        return 'Verification token mismatch', 403

    elif request.method == 'POST':
        data = request.get_json()
        try:
            if 'object' in data and data['object'] == 'whatsapp_business_account':
                for entry in data['entry']:
                    for change in entry['changes']:
                        if change['value'].get('messages'):
                            message = change['value']['messages'][0]
                            from_num = message['from']
                            if from_num == ADMIN_NUMBER and message['type'] == 'text':
                                text = message['text']['body'].strip()
                                reply_msg = process_bot_command(text)
                                if reply_msg:
                                    send_official_whatsapp_message(ADMIN_NUMBER, reply_msg)
        except Exception as e:
            print("Error processing webhook data:", e)
        return jsonify({"status": "success"}), 200

def self_ping():
    while True:
        try: requests.get("https://selfcare-bot-python.onrender.com", timeout=10)
        except: pass
        time.sleep(600)

def run_web():
    port = int(os.environ.get("PORT", 8080))
    flask_app.run(host='0.0.0.0', port=port)

# 🛑 සර්වර් එක වැහෙද්දී Scheduler එක ආරක්ෂිතව නිවා දමන පද්ධතිය
def cleanup_at_exit():
    if scheduler.running:
        scheduler.shutdown(wait=False)

if __name__ == '__main__':
    reload_scheduler_jobs()
    scheduler.start()
    atexit.register(cleanup_at_exit) # Shutdown එක ලස්සනට හැඬ්ල් කරයි
    
    # self_ping එක විතරක් background thread එකක run කරනවා
    Thread(target=self_ping, daemon=True).start()
    
    print("All Systems Started Safely with Shutdown Handlers!")
    
    # Flask Web සර්වර් එක Main Thread එකේම රන් කරනවා (කලින් තිබුණු Thread එක අයින් කළා)
    run_web()
