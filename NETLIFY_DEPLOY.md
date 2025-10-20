# 🚀 Deploy lên Netlify

## Bước 1: Import từ GitHub

1. Vào: **https://app.netlify.com/start**
2. Click **"Import from Git"**
3. Chọn **GitHub**
4. Authorize Netlify (nếu chưa)
5. Chọn repository: **check-promo-1m**
6. Click **"Deploy site"**

### Build Settings:
```
Build command: (để trống)
Publish directory: .
```

## Bước 2: Chờ Deploy

- Netlify sẽ tự động build và deploy
- Thời gian: 1-2 phút
- Bạn sẽ nhận được URL như: `https://your-app.netlify.app`

## Bước 3: Test

1. Mở URL deployment
2. Nhập Bearer Token từ ChatGPT
3. Nhập promo codes
4. Click "Bắt đầu kiểm tra"
5. Xem kết quả!

## 📡 Backend API Proxy

Netlify tự động proxy:
```
/backend-api/* → https://chatgpt.com/backend-api/*
```

Được cấu hình trong file `netlify.toml`

## ✅ Hoàn thành!

App giờ sẽ hoạt động y hệt phiên bản local!

---

**URL GitHub**: https://github.com/nhienpv/check-promo-1m

