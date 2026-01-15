# DOKU Kiosk System - Deployment Guide

## 🚀 Production Deployment

### Hedef URL
`https://doku.fokusistatistik.com/kiosk`

---

## 📋 Ön Gereksinimler

### Sunucu Gereksinimleri
- **Node.js:** v18 veya üzeri
- **npm:** v9 veya üzeri
- **PM2:** Process manager (önerilir)
- **Nginx:** Reverse proxy
- **SSL Sertifikası:** Let's Encrypt veya benzeri

### Veritabanı
- **SQLite:** `prisma/dev.db` (production için PostgreSQL önerilir)

---

## 🔧 Kurulum Adımları

### 1. Projeyi Klonlama
```bash
cd /var/www
git clone https://github.com/fokusistatistik/kismkiosk.git
cd kismkiosk
```

### 2. Bağımlılıkları Yükleme
```bash
npm install
```

### 3. Environment Variables (.env)
```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (Production'da değiştirin!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Node Environment
NODE_ENV=production

# Port
PORT=3000
```

### 4. Prisma Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Test Kullanıcıları Ekleme
```bash
node scripts/add-test-users.js
```

### 6. Production Build
```bash
npm run build
```

### 7. PM2 ile Başlatma
```bash
# PM2 kurulumu (eğer yoksa)
npm install -g pm2

# Uygulamayı başlat
pm2 start npm --name "doku-kiosk" -- start

# Otomatik başlatma
pm2 startup
pm2 save
```

---

## 🌐 Nginx Konfigürasyonu

### `/etc/nginx/sites-available/doku.fokusistatistik.com`

```nginx
server {
    listen 80;
    server_name doku.fokusistatistik.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name doku.fokusistatistik.com;

    # SSL Sertifikaları
    ssl_certificate /etc/letsencrypt/live/doku.fokusistatistik.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/doku.fokusistatistik.com/privkey.pem;

    # SSL Ayarları
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Kiosk App
    location /kiosk {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Endpoints
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS Headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Files
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### Nginx'i Aktifleştirme
```bash
sudo ln -s /etc/nginx/sites-available/doku.fokusistatistik.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# Sertifika oluşturma
sudo certbot --nginx -d doku.fokusistatistik.com

# Otomatik yenileme
sudo certbot renew --dry-run
```

---

## 📊 Monitoring ve Logs

### PM2 Monitoring
```bash
# Durum kontrolü
pm2 status

# Logları görüntüleme
pm2 logs doku-kiosk

# Restart
pm2 restart doku-kiosk

# Stop
pm2 stop doku-kiosk
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

---

## 🧪 Production Test

### 1. Health Check
```bash
curl https://doku.fokusistatistik.com/kiosk
```

### 2. API Test
```bash
curl -X POST https://doku.fokusistatistik.com/api/mobile/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "test",
    "user_id": "17422776208",
    "user_name": "Test User",
    "device_info": {"uuid": "test"}
  }'
```

---

## 🔄 Güncelleme (Update)

```bash
cd /var/www/kismkiosk
git pull origin main
npm install
npm run build
pm2 restart doku-kiosk
```

---

## 🐛 Troubleshooting

### Port 3000 Kullanımda
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### PM2 Çalışmıyor
```bash
pm2 delete doku-kiosk
pm2 start npm --name "doku-kiosk" -- start
```

### Database Hatası
```bash
npx prisma db push --force-reset
node scripts/add-test-users.js
```

---

## 📞 Destek

**Geliştirici:** Fokus İstatistik  
**Email:** info@fokusistatistik.com  
**GitHub:** https://github.com/fokusistatistik/kismkiosk

---

> **Son Güncelleme:** 16.01.2026  
> **Versiyon:** 1.0.0  
> **Durum:** Production Ready ✅
