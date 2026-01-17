# 📟 DOKU Kiosk Sistemi

Modern, güvenli ve gerçek zamanlı (Socket.io) kiosk erişim kontrol sistemi.

## 🎯 Temel Özellikler
- ✅ **QR Kod Geçiş:** JWT tabanlı, zaman ayarlı güvenli QR kodlar.
- ✅ **Real-time:** Socket.io ile anlık cihaz haberleşmesi.
- ✅ **Admin Panel:** Kiosk, kullanıcı ve lokasyon yönetimi.
- ✅ **PWA Desteği:** Mobil tarayıcı ve uygulama uyumluluğu.
- ✅ **Anomali Tespiti:** Çıkış unutma ve hızlı geçiş kontrolleri.

---

## 🚀 Hızlı Başlangıç

### 1. Kurulum
```bash
npm install
npx prisma generate
npx prisma db push
```

### 2. Başlatma
```bash
# Geliştirme modu
npm run dev

# Production build
npm run build
npm start
```

---

## 📚 Dokümantasyon

Tüm detaylı bilgiler için ilgili dokümanı inceleyin:

- 🚢 [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Production build ve sunucu kurulum adımları.
- 📱 [**KIOSK_INTEGRATION.md**](./KIOSK_INTEGRATION.md) - Mobil uygulama API entegrasyonu ve teknik detaylar.
- 📱 [**MOBIL_PWA.md**](./DOKU_MOBIL_PWA_DOCS.md) - Mobil uygulama teknik şartnamesini içerir.

---

## 🛠️ Teknolojiler
- **Framework:** Next.js 15.1.5 (Stabil)
- **Engine:** Node.js (Express + Socket.io)
- **Database:** Prisma + SQLite
- **Styling:** TailwindCSS

---

## 🔐 Varsayılan Bilgiler
- **Admin Panel:** `https://kiosk.fokusistatistik.com/admin`
- **Admin Kullanıcı:** `kocaeliilsaglik`
- **Şifre:** `Kocaeliilsaglik41.Kocaeli`

---

## 📞 İletişim
**Fokus İstatistik**  
🌐 [fokusistatistik.com](https://fokusistatistik.com)  
📧 info@fokusistatistik.com

---
**Son Güncelleme:** 16.01.2026 | **Versiyon:** 1.0.1  
**Durum:** Production Ready ✅
