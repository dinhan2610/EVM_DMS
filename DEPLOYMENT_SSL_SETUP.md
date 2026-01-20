# 🔒 SSL/HTTPS Setup Guide cho Backend API

## ⚠️ Vấn đề Mixed Content

Website đang chạy trên HTTPS nhưng API backend đang dùng HTTP, dẫn đến lỗi:
```
Mixed Content: The page at 'https://www.knsinvoice.id.vn/auth/sign-in' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://159.223.64.31/api/Auth/login'. 
This request has been blocked; the content must be served over HTTPS.
```

## ✅ Các file đã được update sử dụng HTTPS:
- `.env.production` - `VITE_API_BASE_URL=https://159.223.64.31/api`
- `vercel.json` - Tất cả rewrites đã dùng `https://`

## 🔧 Cách cấu hình SSL/HTTPS cho Backend (.NET Core)

### **Option 1: Sử dụng Domain với Let's Encrypt (Khuyến nghị)** ⭐

1. **Tạo subdomain cho API:**
   ```
   api.knsinvoice.id.vn → 159.223.64.31
   ```

2. **Cài đặt Certbot trên Ubuntu server:**
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx
   ```

3. **Cấu hình Nginx làm reverse proxy:**
   ```nginx
   # /etc/nginx/sites-available/api-kns
   server {
       listen 80;
       server_name api.knsinvoice.id.vn;
       
       location / {
           return 301 https://$server_name$request_uri;
       }
   }

   server {
       listen 443 ssl http2;
       server_name api.knsinvoice.id.vn;
       
       # SSL Certificate (sẽ được tạo bởi Certbot)
       ssl_certificate /etc/letsencrypt/live/api.knsinvoice.id.vn/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.knsinvoice.id.vn/privkey.pem;
       
       # SSL Settings
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       # Proxy to .NET Core app
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection keep-alive;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable site và lấy SSL certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/api-kns /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   
   # Lấy SSL certificate từ Let's Encrypt
   sudo certbot --nginx -d api.knsinvoice.id.vn
   ```

5. **Auto-renew certificate:**
   ```bash
   sudo certbot renew --dry-run
   ```

6. **Update frontend config để dùng domain:**
   ```bash
   # .env.production
   VITE_API_BASE_URL=https://api.knsinvoice.id.vn/api
   
   # vercel.json - update tất cả destination
   "destination": "https://api.knsinvoice.id.vn/api/:match*"
   ```

---

### **Option 2: Self-Signed Certificate (Development/Testing)** 🔧

⚠️ **Chỉ dùng cho testing, không dùng cho production!**

1. **Tạo self-signed certificate:**
   ```bash
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt
   ```

2. **Cấu hình Nginx:**
   ```nginx
   server {
       listen 443 ssl;
       server_name 159.223.64.31;
       
       ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
       ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
       
       location / {
           proxy_pass http://localhost:5000;
           # ... (giống như trên)
       }
   }
   ```

3. **⚠️ Lưu ý:** Browser sẽ cảnh báo "Not Secure" vì certificate tự ký.

---

### **Option 3: Cloudflare Flexible SSL (Nhanh nhất)** ⚡

1. **Add domain vào Cloudflare** (nếu chưa có)
2. **Tạo subdomain:** `api.knsinvoice.id.vn` → `159.223.64.31`
3. **Enable SSL/TLS:**
   - Go to SSL/TLS → Overview
   - Select **"Flexible"** (HTTPS từ user → Cloudflare, HTTP từ Cloudflare → origin)
   - Hoặc **"Full"** nếu backend có SSL
4. **Update frontend config:**
   ```env
   VITE_API_BASE_URL=https://api.knsinvoice.id.vn/api
   ```

---

## 📋 Checklist sau khi setup SSL:

- [ ] Backend API có thể access qua HTTPS
- [ ] Certificate hợp lệ (không có warning trên browser)
- [ ] Test API endpoint: `curl https://api.knsinvoice.id.vn/api/Auth/login`
- [ ] Update `.env.production` với HTTPS URL
- [ ] Update `vercel.json` với HTTPS URL
- [ ] Rebuild và redeploy frontend
- [ ] Test login trên production site

---

## 🔍 Kiểm tra sau khi deploy:

```bash
# Test API endpoint
curl -I https://api.knsinvoice.id.vn/api/Auth/login

# Kiểm tra SSL certificate
openssl s_client -connect api.knsinvoice.id.vn:443 -servername api.knsinvoice.id.vn

# Test từ frontend (browser console)
fetch('https://api.knsinvoice.id.vn/api/Auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test', password: 'test' })
}).then(r => console.log(r.status))
```

---

## 🚨 Nếu không thể setup SSL ngay:

**Temporary workaround (không khuyến nghị):**

Có thể tạm thời cho phép Mixed Content bằng cách:
1. Add meta tag trong `index.html`:
   ```html
   <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
   ```
   ⚠️ Nhưng điều này **không an toàn** và có thể không hoạt động trên mọi browser.

2. Hoặc user phải tự enable "Insecure content" trong browser settings.

**➡️ Giải pháp tốt nhất vẫn là setup HTTPS cho backend!**

---

## 📞 Support

Nếu cần hỗ trợ setup SSL:
- Liên hệ team DevOps/Backend
- Hoặc sử dụng services như Cloudflare (free SSL)
