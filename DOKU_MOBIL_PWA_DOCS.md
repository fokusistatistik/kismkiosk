# DOKU Mobil Uygulaması (PWA) - Teknik Şartname ve Entegrasyon Rehberi

Bu doküman, DOKU Kiosk sistemi ile entegre çalışacak olan **DOKU Mobil PWA** projesinin geliştirilmesi için gerekli teknik detayları, tasarım kurallarını ve entegrasyon standartlarını içerir.

---

## 1. Proje Kimliği ve Tasarım
Uygulama, mevcut Kiosk sistemiyle görsel bütünlük içinde olmalı, modern ve "Premium" bir his vermelidir.

### 1.1. Marka Varlıkları (Assets)
- **Logo (Büyük/Favicon):**  
  `https://static.fokusistatistik.com/DOKU/logos/DOKU_FAVICON.png`
- **Uygulama Adı:** DOKU (Dijital Otomasyon Kontrol Uygulaması)

### 1.2. Renk Paleti ve Tema
- **Tema:** Dark Mode öncelikli (AMOLED Black / Neutral-950).
- **Ana Renkler:**
  - **Primary:** Blue-600 (`#2563eb`)
  - **Gradient:** Blue-400 -> Purple-400 -> Indigo-400
  - **Background:** Neutral-950 (`#0a0a0a`)
  - **Surface/Card:** Neutral-900 / 800
- **Font:** Inter veya Geist Sans (Modern, okunabilir).

---

## 2. Teknik Gereksinimler (PWA)
Uygulama bir **Progressive Web App (PWA)** olarak geliştirilecektir.

- **Altyapı:** Next.js 14/15, TailwindCSS.
- **PWA Özellikleri:**
  - `manifest.json` tam yapılandırılmalı (Standalone mode).
  - iOS ve Android ana ekrana ekleme (Add to Home Screen) desteği.
  - Kamera erişimi (HTTPS zorunlu).
- **Kütüphaneler:**
  - QR Okuma: `react-qr-reader` veya `html5-qrcode`.
  - Token İşleme: `jwt-decode` (Secret key gerektirmez, sadece okumak için).

---

## 3. Kiosk Entegrasyon (Core Logic)

Uygulamanın kalbi, Kiosk ekranındaki dinamik QR kodunu okuyup sunucuya doğrulatmasıdır.

### 3.1. QR Kod Yapısı (JWT)
Kiosk cihazları, **JWT (JSON Web Token)** formatında QR kodlar üretir. Bu kodlar şifreli **değildir**, sadece imzalıdır. Mobil uygulama bu token'ı `jwt-decode` ile açıp içindeki veriyi kullanıcıya göstermelidir.

**JWT Payload Örneği:**
```json
{
  "kid": "kiosk-ana-giris-01",  // Kiosk ID
  "nam": "Fokus Ana Kapı",      // Kiosk Görünür Adı (Ekrana basılacak)
  "loc": "lokasyon-uuid",       // Konum ID
  "iat": 1705555555             // Oluşturulma Zamanı (Unix)
}
```

### 3.2. İş Akışı (Workflow)

1.  **Tarama:** Kullanıcı "QR Tara" butonuna basar, kamera açılır.
2.  **Algılama:** Kamera QR kodu yakalar (String: `eyJhbGci...`).
3.  **Decode & Önizleme (Client-Side):**
    - Uygulama token'ı decode eder.
    - `nam` alanını çeker.
    - Kullanıcıya sorar: **"[nam] cihazından geçiş yapıyorsunuz. Onaylıyor musunuz?"**
4.  **Doğrulama (Server-Side):**
    - Kullanıcı onaylarsa, token olduğu gibi (ham haliyle) sunucuya gönderilir.
    - Sunucu imza ve süre kontrolünü yapar.

### 3.3. API Endpoint
Sunucu ile iletişim için aşağıdaki endpoint kullanılır.

- **URL:** `[KIOSK_SERVER_URL]/api/mobile/scan`
- **Method:** `POST`
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "qr_token": "eyJhbGciOiJIUzI1Ni...", // Okunan HAM token
  "user_id": "user-uuid-1234",         // Uygulamaya giriş yapmış personel ID
  "device_uuid": "device-uuid-5678"    // Telefonun benzersiz ID'si (Opsiyonel)
}
```

**Response:**
- `200 OK`: `{ success: true }` -> Yeşil onay ekranı göster.
- `400 Bad Request`: `{ error: "Expired" }` -> "Süre doldu" hatası göster.
- `401/403`: Yetkisiz cihaz/kullanıcı.

---

## 4. Kullanıcı Arayüzü (UI) Taslakları

### A. Giriş Ekranı (Splash & Login)
- Ortada büyük **DOKU Logosu**.
- Altında "Hoş Geldiniz" yazısı.
- TC Kimlik / Şifre giriş formları.

### B. Ana Sayfa (Dashboard)
- Üstte Kullanıcı Kartı (Fotoğraf, İsim, Ünvan).
- Ortada Büyük "QR Tara" butonu (Floating Action Button veya Merkezi Kart).
- Altta "Son Geçişler" listesi (Opsiyonel).

### C. Tarama Ekranı
- Tam ekran kamera vizörü.
- Kenşeleri yuvarlatılmış tarama çerçevesi (Overlay).
- QR algılandığında alttan çıkan "Bottom Sheet" (Cihaz bilgisi ve Onay butonu).

---

## 5. Güvenlik ve Uyumluluk Notları
- **HTTPS:** Kamera erişimi için uygulamanın HTTPS üzerinden sunulması zorunludur.
- **Kamera İzni:** Uygulama açılışta değil, ilk tarama butonuna basıldığında izin istemelidir.
- **Token:** QR token'ları kısa sürelidir (20-30sn). Kullanıcı okuttuktan sonra hemen göndermelidir. Bekletirse "Süre Doldu" hatası alır.

Bu doküman, DOKU Mobil PWA projesinin temel yapı taşlarını oluşturur. Geliştirme sürecinde Kiosk Backend ekibi ile koordineli çalışılması önerilir.
