# 🚀 Hướng dẫn Deploy

## ⚠️ LƯU Ý QUAN TRỌNG

Vì Vercel CLI gặp lỗi build, **PHẢI deploy qua GitHub**.

## 📦 Bước 1: Push lên GitHub

```bash
# Tạo Git repo (nếu chưa có)
git init

# Add files
git add .

# Commit
git commit -m "Add promo checker app"

# Tạo repo mới trên GitHub
# Vào: https://github.com/new

# Add remote và push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 🌐 Bước 2: Deploy trên Vercel

1. Vào https://vercel.com/new
2. Click **"Import Git Repository"**
3. Chọn repo vừa tạo
4. Click **"Import"**
5. **KHÔNG** cần config gì, click **"Deploy"**
6. Đợi deploy xong

## ⚙️ Bước 3: Cấu hình Environment Variables

1. Vào Vercel Dashboard → Your Project
2. Click **"Settings"** → **"Environment Variables"**
3. Add các biến sau:

### ✅ BẮT BUỘC:

**Variable:** `OPENAI_BEARER`  
**Value:** `eyJhbGci...` (Bearer token từ ChatGPT)

### 📱 TÙY CHỌN (Telegram):

**Variable:** `TG_BOT_TOKEN`  
**Value:** `1234567890:ABC...`

**Variable:** `TG_CHAT_ID`  
**Value:** `123456789`

4. Click **"Save"**

## 🔄 Bước 4: Redeploy

1. Vào tab **"Deployments"**
2. Click **"..."** ở deployment mới nhất
3. Click **"Redeploy"**
4. Chờ build xong

## ✅ Bước 5: Test

1. Mở URL deployment (vd: `https://your-app.vercel.app`)
2. Test API:
   - Vào `https://your-app.vercel.app/api/check?code=FREEGPT4OMINI`
   - Phải thấy response JSON

3. Test app:
   - Nhập promo codes
   - Click "Bắt đầu kiểm tra"
   - Xem kết quả

## 🎯 Lấy Token

### ChatGPT Bearer Token:
1. Mở https://chatgpt.com
2. F12 → Network
3. Refresh
4. Click request bất kỳ
5. Tìm header "Authorization"
6. Copy giá trị sau chữ "Bearer "

### Telegram Bot:
1. Mở Telegram
2. Search @BotFather
3. `/newbot`
4. Follow instructions

### Telegram Chat ID:
1. Search @userinfobot
2. `/start`
3. Copy ID

## 🆘 Troubleshooting

### API trả về 500:
- Check Environment Variables đã add chưa
- Check token còn valid không
- Redeploy lại

### Build fail:
- Check GitHub repo có đầy đủ files không
- Xem build logs trên Vercel
- Thử xóa project và import lại

### CORS error:
- API đã có CORS headers
- Check Network tab xem request có đi đến API không

---

**Thành công!** 🎉

App sẽ LIVE tại: `https://your-app.vercel.app`

