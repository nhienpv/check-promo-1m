# ChatGPT Promo Checker

App kiểm tra mã khuyến mãi ChatGPT với Netlify Edge Functions.

## 🚀 Deploy lên Netlify

**GitHub Repo**: https://github.com/nhienpv/check-promo-1m

### Bước deploy:

1. Vào: https://app.netlify.com/start
2. Import from Git → GitHub
3. Chọn repo: **check-promo-1m**
4. Deploy!

## ⚙️ Cấu hình

Token và Telegram config được lấy từ file `config.js`:

```javascript
const CONFIG = {
    BEARER_TOKEN: 'your_token_here',
    aaaa: 'telegram_bot_token',
    aaaaa: 'telegram_chat_id'
};
```

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


