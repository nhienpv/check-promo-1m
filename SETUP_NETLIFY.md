# 🚀 Deploy lên Netlify - Hướng dẫn chi tiết

## ✅ Đã push lên GitHub

**Repo**: https://github.com/nhienpv/check-promo-1m

---

## 📦 BƯỚC 1: Deploy từ GitHub

### Vào Netlify Dashboard:
👉 **https://app.netlify.com/start**

### Import Repository:
1. Click **"Import from Git"**
2. Chọn **GitHub**
3. Authorize Netlify (nếu lần đầu)
4. Tìm và chọn repo: **check-promo-1m**

### Deploy Settings:
```
Build command: (để trống)
Publish directory: . (hoặc để trống)
Functions directory: netlify/functions (tự động detect)
```

5. Click **"Deploy site"**
6. Đợi 1-2 phút

---

## ⚙️ BƯỚC 2: Add Environment Variables (QUAN TRỌNG!)

### Sau khi deploy xong:

1. Vào **Site settings** → **Environment variables**
2. Click **"Add a variable"**

### Thêm 3 biến sau:

#### ✅ BẮT BUỘC:

**Variable name**: `OPENAI_BEARER`  
**Value**: `eyJhbGciOiJSUzI1NiIs...` (Bearer token từ ChatGPT)

#### 📱 TÙY CHỌN (Telegram):

**Variable name**: `TG_BOT_TOKEN`  
**Value**: `1234567890:ABC...`

**Variable name**: `TG_CHAT_ID`  
**Value**: `123456789`

3. Click **"Save"**

---

## 🔄 BƯỚC 3: Redeploy

Sau khi add Environment Variables:

1. Vào tab **"Deploys"**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Chờ build lại (1-2 phút)

---

## 🧪 BƯỚC 4: Test

1. Mở URL deployment (vd: `https://your-app.netlify.app`)

2. **Test API trước**:
   ```
   https://your-app.netlify.app/.netlify/functions/check?code=FREEGPT4OMINI
   ```
   Phải thấy JSON response

3. **Test App**:
   - Nhập promo codes
   - Click "Bắt đầu kiểm tra"
   - Xem kết quả

4. **Kết quả phân loại**:
   - ✅ **LIVE** = Singapore/Malaysia (màu xanh)
   - 🔶 **INELIGIBLE** = Vietnam (màu vàng)
   - ⛔ **DEAD** = Hết hạn (màu đỏ)

---

## 🔐 Lấy Token và Telegram Config

### ChatGPT Bearer Token:
1. Mở https://chatgpt.com
2. F12 → Network
3. Refresh → Click request bất kỳ
4. Headers → Authorization
5. Copy giá trị sau "Bearer "

### Telegram Bot Token:
1. Chat với @BotFather
2. `/newbot`
3. Đặt tên bot
4. Copy token

### Telegram Chat ID:
1. Chat với @userinfobot
2. `/start`
3. Copy ID của bạn

---

## 📊 Cấu trúc Files

```
empva/
├── netlify/
│   └── functions/
│       ├── check.js          # API check promo code
│       └── notify.js         # API gửi Telegram
├── index.html                # Giao diện
├── script.js                 # Logic (gọi Netlify functions)
├── style.css                 # Styles
├── netlify.toml              # Netlify config
└── README.md
```

---

## 🆘 Troubleshooting

### Lỗi 500 khi check:
- Kiểm tra Environment Variables đã add chưa
- Tên biến phải chính xác: `OPENAI_BEARER`
- Redeploy lại

### Telegram không gửi:
- Check `TG_BOT_TOKEN` và `TG_CHAT_ID` đã đúng chưa
- Test bot bằng cách chat trực tiếp

### Functions not found:
- Check `netlify.toml` có đúng không
- Folder `netlify/functions` phải có 2 files
- Redeploy

---

## ✅ Checklist

- [ ] Push code lên GitHub
- [ ] Import vào Netlify
- [ ] Add Environment Variables (OPENAI_BEARER)
- [ ] Add Telegram config (optional)
- [ ] Redeploy
- [ ] Test API endpoint
- [ ] Test app

---

**Chúc bạn deploy thành công!** 🎉

GitHub: https://github.com/nhienpv/check-promo-1m  
Netlify: https://app.netlify.com/start

