# ChatGPT Promo Checker

App kiểm tra mã khuyến mãi ChatGPT với Netlify Edge Functions và Environment Variables.

## 🚀 Deploy lên Netlify

**GitHub Repo**: https://github.com/nhienpv/check-promo-1m

### Bước deploy:

1. Vào: https://app.netlify.com/start
2. Import from Git → GitHub
3. Chọn repo: **check-promo-1m**
4. Deploy!

## ⚙️ Environment Variables (Netlify Dashboard)

Sau khi deploy, vào **Site settings** → **Environment variables** và thêm:

| Variable | Mô tả | Ví dụ |
|----------|-------|-------|
| `OPENAI_BEARER` | ChatGPT Bearer Token (bắt buộc) | `eyJhbGciOiJSUzI1NiIs...` |
| `TG_BOT_TOKEN` | Telegram Bot Token (tùy chọn) | `1234567890:ABC...` |
| `TG_CHAT_ID` | Telegram Chat ID (tùy chọn) | `123456789` |

### Cách lấy Token:

1. **ChatGPT Token**: 
   - Vào https://chatgpt.com
   - F12 → Network → Any request → Headers → Authorization
   - Copy Bearer token

2. **Telegram Bot**:
   - Chat với @BotFather
   - `/newbot` → Chọn tên → Lấy token
   - Chat ID: Chat với bot → F12 → Network → Lấy chat_id

## 📋 Kết quả phân loại

- **LIVE (Singapore/Malaysia)**: Mã còn hạn, user chưa dùng
- **INELIGIBLE (Vietnam)**: Mã còn hạn, user đã là subscriber
- **DEAD**: Mã hết hạn hoặc không tồn tại
- **DEAD**: Mã hết hạn hoặc không tồn tại

## 📱 Telegram Format

```
🎯 Ket qua kiem tra ma 🎯

Ma LIVE (Singapore/Malaysia): X ma
🕐 time
💬 details
link1
link2
link3
...

Ma INELIGIBLE (Vietnam): X ma
🕐 time
💬 details
link1
link2
link3
...
```

## 🛠️ Deploy

```bash
vercel --prod --yes
```

---

Made by nhienpv


