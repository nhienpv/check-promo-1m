# ChatGPT Promo Checker

App kiểm tra mã khuyến mãi ChatGPT với Vercel Serverless Functions.

## 🚀 Đã Deploy

**URL**: https://empva.vercel.app

## ⚙️ Environment Variables (Vercel Dashboard)

| Variable | Mô tả |
|----------|-------|
| `OPENAI_BEARER` | ChatGPT Bearer Token (bắt buộc) |
| `TG_BOT_TOKEN` | Telegram Bot Token (tùy chọn) |
| `TG_CHAT_ID` | Telegram Chat ID (tùy chọn) |

## 📋 Kết quả phân loại

- **LIVE (Singapore/Malaysia)**: Mã còn hạn, user chưa dùng
- **INELIGIBLE (Vietnam)**: Mã còn hạn, user đã là subscriber
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


