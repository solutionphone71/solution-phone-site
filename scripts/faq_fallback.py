#!/usr/bin/env python3
"""FAQ fallback script for Jason widget.
When a question is not found in the local FAQ, this script:
1. Checks data/custom_faq.json for a stored answer.
2. If found, returns it.
3. Otherwise, sends a Telegram notification to the operator (Sébastien).
The operator can reply via the bot, which should write the answer back to
custom_faq.json. The script then returns a JSON payload indicating the status.
"""
import os, sys, json, urllib.parse, urllib.request

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FAQ_FILE = os.path.join(BASE_DIR, 'data', 'custom_faq.json')

# Telegram credentials from environment
TELEGRAM_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

def load_faq():
    if not os.path.exists(FAQ_FILE):
        return {}
    with open(FAQ_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_faq(data):
    with open(FAQ_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def send_telegram(message):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    url = f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage'
    payload = urllib.parse.urlencode({
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'Markdown'
    }).encode()
    try:
        urllib.request.urlopen(url, data=payload, timeout=5)
        return True
    except Exception:
        return False

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'status': 'error', 'error': 'question missing'}))
        sys.exit(1)
    question = sys.argv[1].strip()
    faq = load_faq()
    answer = faq.get(question)
    if answer:
        print(json.dumps({'status': 'known', 'answer': answer}, ensure_ascii=False))
        sys.exit(0)
    # Not known – notify operator
    msg = f'❓ *FAQ inconnue*\nQuestion: "{question}"\nRépondez en envoyant le texte de la réponse.'
    sent = send_telegram(msg)
    if sent:
        print(json.dumps({'status': 'sent'}, ensure_ascii=False))
    else:
        print(json.dumps({'status': 'error', 'error': 'Telegram send failed'}, ensure_ascii=False))

if __name__ == '__main__':
    main()
