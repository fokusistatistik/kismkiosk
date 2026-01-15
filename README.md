# DOKU Kiosk System

Modern, güvenli ve kullanıcı dostu kiosk erişim kontrol sistemi.

## 🎯 Özellikler

- ✅ **QR Kod Tabanlı Giriş:** JWT ile güvenli, zamana bağlı QR kodlar
- ✅ **Manuel Giriş:** TC Kimlik No ile alternatif giriş
- ✅ **Mobil Entegrasyon:** PWA desteği ile mobil uygulama entegrasyonu
- ✅ **Real-time Güncelleme:** Socket.IO ile anlık bildirimler
- ✅ **Admin Panel:** Kullanıcı, kiosk ve lokasyon yönetimi
- ✅ **Fotoğraf Çekimi:** Otomatik giriş fotoğrafı
- ✅ **Cihaz Kilitleme:** Tek cihaz politikası
- ✅ **Anomali Tespiti:** Hızlı geçiş, kaçırılan çıkış kontrolü

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm 9+

### Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Veritabanını hazırla
npx prisma generate
npx prisma db push

# Test kullanıcıları ekle
node scripts/add-test-users.js

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

## 📱 Mobil Uygulama Entegrasyonu

Mobil uygulama geliştirme için detaylı bilgi:
- [DOKU_MOBIL_PWA_DOCS.md](./DOKU_MOBIL_PWA_DOCS.md)
- [KIOSK_INTEGRATION.md](./KIOSK_INTEGRATION.md)

## 🔐 Varsayılan Giriş Bilgileri

### Admin Panel
- **URL:** `http://localhost:3000/admin`
- **Kullanıcı:** `kocaeliilsaglik`
- **Şifre:** `Kocaeliilsaglik41.Kocaeli`

### Test Kullanıcıları
- **TC:** `17422776208` (Şifre: `1742`)
- **TC:** `24400543608` (Şifre: `2440`)

## 📚 Dokümantasyon

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment rehberi
- [DOKU_MOBIL_PWA_DOCS.md](./DOKU_MOBIL_PWA_DOCS.md) - Mobil uygulama teknik şartnamesi
- [KIOSK_INTEGRATION.md](./KIOSK_INTEGRATION.md) - Kiosk entegrasyon rehberi
- [DOKU_NOTES.md](./DOKU_NOTES.md) - Geliştirici notları

## 🛠️ Teknolojiler

- **Frontend:** Next.js 15, React, TailwindCSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** SQLite (Prisma ORM)
- **Auth:** JWT
- **QR:** JWT-based time-windowed tokens

## 📁 Proje Yapısı

```
kismkiosk/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel
│   ├── kiosk/[id]/        # Kiosk ekranları
│   └── page.tsx           # Ana sayfa
├── components/            # React bileşenleri
├── prisma/               # Database schema
├── public/               # Static dosyalar
├── scripts/              # Utility scriptler
├── utils/                # Helper fonksiyonlar
└── server.js             # Custom Express server
```

## 🔄 API Endpoints

### Mobil Uygulama
- `POST /api/mobile/scan` - QR kod doğrulama

### Kiosk
- `GET /api/kiosk/qr-token` - QR token oluşturma
- `POST /api/kiosk/manual-entry` - Manuel giriş
- `POST /api/kiosk/upload-photo` - Fotoğraf yükleme

### Admin
- `POST /api/admin/login` - Admin girişi

## 🧪 Test

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 📊 Database Schema

Prisma schema detayları için: `prisma/schema.prisma`

Temel modeller:
- **User:** Kullanıcı bilgileri
- **Kiosk:** Kiosk cihazları
- **Location:** Lokasyonlar
- **AccessLog:** Giriş/çıkış kayıtları

## 🌐 Production Deployment

Production deployment için detaylı rehber: [DEPLOYMENT.md](./DEPLOYMENT.md)

**Hedef URL:** `https://doku.fokusistatistik.com/kiosk`

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje Fokus İstatistik tarafından geliştirilmiştir.

## 📞 İletişim

**Fokus İstatistik**  
Email: info@fokusistatistik.com  
Website: https://fokusistatistik.com

---

> **Versiyon:** 1.0.0  
> **Son Güncelleme:** 16.01.2026  
> **Durum:** Production Ready ✅
