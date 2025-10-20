# ChatGPT Promo Checker

Check ChatGPT promo codes in batch mode with real-time results.

## 🚀 Deploy to Vercel

### Option 1: Via GitHub (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Click Deploy
5. Add Environment Variables (see below)

### Option 2: Via CLI

```bash
vercel --prod
```

## ⚙️ Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_BEARER` | Your ChatGPT Bearer Token | `eyJhbGci...` |
| `TG_BOT_TOKEN` | Telegram Bot Token (optional) | `1234567890:ABC...` |
| `TG_CHAT_ID` | Telegram Chat ID (optional) | `123456789` |

### Get ChatGPT Bearer Token:
1. Open https://chatgpt.com
2. Press F12 (DevTools)
3. Go to Network tab
4. Refresh page
5. Click any request
6. Find "Authorization" header
7. Copy the value (starts with `eyJ...`)

### Get Telegram Bot Token:
1. Open Telegram
2. Search for @BotFather
3. Send `/newbot`
4. Follow instructions
5. Copy the token

### Get Telegram Chat ID:
1. Search for @userinfobot
2. Send `/start`
3. Copy your ID

## 📡 API Endpoints

### Check Promo Code
```
GET /api/check?code=YOUR_PROMO_CODE
```

Response:
```json
{
  "metadata": {...},
  "is_eligible": true/false,
  "ineligible_reason": "..."
}
```

### Send Telegram Notification
```
POST /api/notify
Content-Type: application/json

{
  "results": [
    {
      "code": "ABC123",
      "status": "LIVE",
      "details": "50% off...",
      "timestamp": "12:00:00"
    }
  ]
}
```

## 🎯 Features

- ✅ Batch checking with concurrent requests
- ✅ Real-time statistics
- ✅ Filter by status (LIVE/DEAD/INELIGIBLE)
- ✅ Export results
- ✅ Telegram notifications
- ✅ Dark theme UI
- ✅ Responsive design

## 📝 Usage

1. Open the deployed app
2. Paste promo codes (one per line)
3. Click "Bắt đầu kiểm tra"
4. View results in real-time
5. Export or send to Telegram

## 🔒 Security

- Bearer token is stored server-side via environment variables
- API functions act as proxy to hide sensitive data
- CORS enabled for API endpoints

## 📄 License

MIT

---

Made with ❤️ by nhienpv

