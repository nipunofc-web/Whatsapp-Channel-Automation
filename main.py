import os
import time
from datetime import datetime
import requests
from flask import Flask
from threading import Thread
from apscheduler.schedulers.background import BackgroundScheduler
import pytz

# --- 🔴 ඔබේ විස්තර සහ API CONFIGURATIONS ---
BIN_ID = "6a0b4598ee5a733b12dd43b0"
API_KEY = "$2a$10$OBbATu.0sP8Tp6aIpz.4/.5GDh89dJyKwTJfO9j88y2JrvefEFOVC"

# --- 🟢 WHATSAPP API CONFIGURATIONS ---
# ⚠️ මෙන්න මේ පේළි 3ට විතරක් ඔයා UltraMsg එකෙන් ගත්ත විස්තර දාන්න පැටියෝ 👇
WA_API_URL = "https://api.ultramsg.com/instance99999/messages/chat"  # ඔයාගේ Instance ID එක අගට දාන්න
WA_TOKEN = "ab12cd34ef56gh78ij90"  # UltraMsg එකෙන් දුන්න දිග Token එක මෙතනට දාන්න
WA_CHANNEL_JID = "1203632123456789@newsletter"  # චැනල් එකේ @newsletter ID එක මෙතනට දාන්න

SL_TZ = pytz.timezone('Asia/Colombo')
scheduler = BackgroundScheduler(timezone=SL_TZ)
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
    try: requests.put(url, headers=headers, json=data)
    except Exception as e: print("Database save error:", e)

# --- ✉️ WhatsApp Message Sending ---
def send_whatsapp_message(text):
    payload = {
        "token": WA_TOKEN,
        "to": WA_CHANNEL_JID,
        "body": text,
        "priority": 10
    }
    headers = {"content-type": "application/x-www-form-urlencoded"}
    try:
        response = requests.post(WA_API_URL, data=payload, headers=headers, timeout=10)
        print("WhatsApp Broadcast Response:", response.json())
    except Exception as e:
        print("Failed to send WhatsApp message:", e)

# --- ⏰ Scheduler Task ---
def job_trigger():
    db = load_db()
    if db.get("scheduler_status") == "stopped": return
    current_time = datetime.now(SL_TZ).strftime("%H:%M")
    saved_times = db.get("schedule_times", [])
    if current_time in saved_times:
        message_to_send = db.get("saved_message", "")
        if message_to_send:
            send_whatsapp_message(message_to_send)

def reload_scheduler_jobs():
    scheduler.remove_all_jobs()
    scheduler.add_job(job_trigger, 'cron', minute='*')

def parse_time_string(time_str):
    time_str = time_str.strip().lower()
    try:
        in_time = datetime.strptime(time_str, "%I.%M%p")
        return in_time.strftime("%H:%M")
    except ValueError:
        try:
            in_time = datetime.strptime(time_str, "%I:%M%p")
            return in_time.strftime("%H:%M")
        except ValueError: return None

# --- 🎮 Command Processor ---
def process_bot_command(command_text):
    command_text = command_text.strip()
    db = load_db()
    
    if command_text == ".start":
        db["scheduler_status"] = "started"
        save_db(db)
        return "✅ Auto Scheduler එක සක්‍රීය කළා!"
    elif command_text == ".stop":
        db["scheduler_status"] = "stopped"
        save_db(db)
        return "🛑 Auto Scheduler එක නැවැත්තුවා!"
    elif command_text.startswith(".set "):
        time_raw_data = command_text.replace(".set ", "")
        raw_list = time_raw_data.split(",")
        parsed_times = []
        for t in raw_list:
            formatted_t = parse_time_string(t)
            if formatted_t: parsed_times.append(formatted_t)
            else: return f"❌ වැරදි වෙලාවක්: '{t}'"
        if parsed_times:
            db["schedule_times"] = parsed_times
            save_db(db)
            reload_scheduler_jobs()
            return f"📅 අලුත් වෙලාවන් සකස් කළා: {', '.join(parsed_times)}"
    elif command_text.startswith(".add "):
        msg_content = command_text.replace(".add ", "").strip()
        if msg_content:
            db["saved_message"] = msg_content
            save_db(db)
            return "📝 සෙඩියුල් මැසේජ් එක Update කළා!"
    return None

# --- 🌐 Web Server Setup & Self Ping ---
@flask_app.route('/')
def home(): return "WhatsApp Channel Scheduler Bot is Running 24/7!"

def self_ping():
    while True:
        try: requests.get("https://selfcare-bot-python.onrender.com", timeout=10)
        except: pass
        time.sleep(600)

def run_web():
    port = int(os.environ.get("PORT", 8080))
    flask_app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    reload_scheduler_jobs()
    scheduler.start()
    Thread(target=run_web).start()
    Thread(target=self_ping).start()
    print("All System Started Successfully!")
