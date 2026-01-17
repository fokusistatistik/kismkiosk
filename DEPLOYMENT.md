# 🚀 DOKU Kiosk - Deployment Kılavuzu

Bu doküman, Kiosk uygulamasının yerelde derlenip (Local Build) sunucuya deploy edilmesi sürecini adım adım açıklar.

## 📦 Paket Bilgileri

- **Paket Adı:** `kiosk-deploy.zip`
- **Next.js:** 15.1.5 (Stabil Sürüm)
- **Node.js:** ≥18.x
- **Veritabanı:** SQLite (Prisma)

---

## 1️⃣ Yerelde Build Hazırlığı

Sunucu kaynaklarını tüketmemek için build işlemini kendi bilgisayarınızda yapınız.

### Production Ayarları
`.env` dosyasındaki API adreslerinin canlı sunucuyu gösterdiğinden emin olun:

```bash
NEXT_PUBLIC_API_URL=https://kiosk.fokusistatistik.com
NEXT_PUBLIC_APP_URL=https://kiosk.fokusistatistik.com
NEXT_PUBLIC_SOCKET_URL=https://kiosk.fokusistatistik.com
```

### Build Alınması
Aşağıdaki komut ile production build oluşturulur (Webpack zorunlu kılınmıştır):

```bash
npm run build
```

---

## 2️⃣ Paketleme ve Transfer

Build işleminden sonra şu dosyaları `kiosk.zip` adıyla ziplayın:

- ✅ `.next/` (Özellikle `.next/standalone` içeriği)
- ✅ `public/`
- ✅ `prisma/`
- ✅ `utils/`
- ✅ `package.json`
- ✅ `server.js`
- ✅ `.env` (Production hali)

**⚠️ ÖNEMLİ:** Standalone yapıda `node_modules` klasörü otomatik olarak `.next/standalone` içine paketlenir.

---

## 3️⃣ Sunucuda Kurulum Adımları (HIZLI VE GÜVENLİ)

**DİKKAT:** Yeni paket (`kiosk.zip`) gerekli tüm bağımlılıkları (`node_modules`) halihazırda içerdiği için sunucuda `npm install` komutunu **ÇALIŞTIRMAYINIZ.** Bu sayede OOM (RAM yetersizliği) ve SSH bağlantı kopması sorunları yaşanmayacaktır.

### 1. Dosyaları Açma
Sunucuya yüklediğiniz paketi hedef dizine çıkarın:

```bash
unzip kiosk.zip
```

### 2. Veritabanı Hazırlığı
Veritabanı şemasını güncelleyin (Bu işlem az kaynak tüketir):

```bash
npx prisma migrate deploy
```

### 3. Uygulamayı Başlatma (PM2)
Standalone yapıya göre derlenmiş uygulamayı başlatın:

```bash
# PM2 ile başlatmak için (Önerilir)
pm2 start server.js --name "kiosk"

# Veya standart başlatma
npm start
```

---

## 🔧 Nginx / Reverse Proxy Yapılandırması

Uygulama artık `kiosk.fokusistatistik.com` üzerinden root yolunda çalışacaktır:

```nginx
location / {
    proxy_pass http://localhost:3011;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Socket.io desteği (Kritik)
location /socket.io/ {
    proxy_pass http://localhost:3011/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## 🆘 Sorun Giderme

- **Native Binary Hatası:** Prisma için Linux (Debian/Ubuntu/Alpine) binary'leri pakete dahil edilmiştir. Eğer farklı bir OS kullanılıyorsa bildirin.
- **Port:** Varsayılan port 3000'dir. Değiştirmek için `.env` veya `PORT=3001` kullanın.
- **Dizin İzinleri:** `public/uploads` klasörünün yazma izinleri olduğundan emin olun.

---
**Son Güncelleme:** 16.01.2026 (Standalone & Pre-installed Optimized)  
**Durum:** Production Ready ✅

