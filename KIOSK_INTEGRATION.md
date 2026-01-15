# Kiosk Sistemi Entegrasyon ve Kullanım Kılavuzu

Bu doküman, Kiosk sisteminin çalışma mantığını, Mobil Uygulama (PWA) entegrasyonu için gerekli teknik detayları ve cihaz yönetim süreçlerini açıklar.

## 1. Sistem Özeti
Kiosk sistemi, personelin kuruma giriş/çıkışlarını QR kod taratarak doğruladığı bir yapıdır.
- **Kiosk Cihazı:** Sabit durur, sürekli değişen, imzalı ve zaman sınırlı bir QR kod üretir.
- **Mobil Uygulama:** Personelin telefonundaki uygulama bu QR kodu okur, doğrular ve sunucuya bildirir.
- **Sunucu:** Bildirimi alır, veritabanına işler ve Kiosk ekranına "Giriş Başarılı" sinyali (Socket.io) gönderir.

## 2. Mobil Uygulama (PWA) Geliştirici Rehberi

Mobil uygulamanın temel görevi, Kiosk ekranındaki QR kodunu okumak, içindeki veriyi ayrıştırmak ve sunucuya iletmektir.

### 2.1. QR Kod Yapısı (JWT)
Kiosk ekranındaki QR kod, **JWT (JSON Web Token)** formatındadır. Şifreli değildir, ancak sunucu tarafından **imzalanmıştır (HMAC SHA256)**. Bu sayede mobil uygulama içeriği okuyabilir (cihaz adını ekrana basabilir) ancak sahte QR üretilemez.

**Örnek Token (Decode Edilmiş Hali):**
```json
{
  "kid": "kiosk-urn-01",      // Kiosk ID (Benzersiz Kimlik)
  "loc": "konum-ana-bina",    // Lokasyon/Kurum ID
  "nam": "Ana Giris Turnike", // Görünür İsim (Kullanıcıya gösterilecek)
  "iat": 1705345678           // Oluşturulma Zamanı (Unix Timestamp - Saniye)
}
```

### 2.2. Mobil Uygulama Akışı
1.  **Kamerayı Aç & Tara:** Uygulama kamerayı açar ve QR kodu algılar.
2.  **JWT Decode:** Okunan QR verisi (eyJ...) bir JWT kütüphanesi (veya base64 decode) ile açılır.
3.  **Kullanıcı Onayı (Opsiyonel ama Önerilir):** Ekranda `nam` (İsim) alanı gösterilir.
    > "Ana Giris Turnike cihazından giriş yapıyorsunuz. Onaylıyor musunuz?"
4.  **Sunucuya Gönder:** Kullanıcı onaylarsa (veya otomatik), token sunucuya POST edilir.

**API Endpoint:**
- **URL:** `/api/mobile/scan`
- **Method:** `POST`
- **Body:**
```json
{
  "qr_token": "eyJhbGl...",      // Okunan orijinal QR string
  "user_id": "user_uuid_123",    // İşlemi yapan personelin ID'si
  "device_uuid": "cep_tlf_uuid"  // Personelin telefonunun benzersiz ID'si (Opsiyonel güvenlik için)
}
```

### 2.3. Hata Yönetimi
- **Süre Aşımı:** QR kodlar yaklaşık 20-30 saniye geçerlidir. Eğer `iat` değeri çok eskiyse sunucu 400 döner. Uygulama "QR Süresi Doldu, Lütfen Yenileyin" diyebilir.
- **Cihaz Doğrulama:** Eğer `kid` veritabanında yoksa veya pasifse hata döner.

## 3. Kiosk Cihaz Yönetimi

### 3.1. Yeni Kiosk Kurulumu (Önemli)
Yeni bir cihazı (tablet/ekran) kiosk yapmak için **Auth (Login)** gerekmez.
1.  Ana Sayfada **"Kiosk Modu (Başlat)"** butonuna basılır.
2.  Açılan ekranda:
    - **Kiosk ID:** Cihaza benzersiz bir ID verilir (örn: `fokus-giris-01`).
    - **Görünür İsim:** İnsanların anlayacağı bir isim (örn: `Fokus Ana Kapı`).
3.  **Başlat** denilir.
4.  Cihaz bu bilgileri hafızasına (LocalStorage) kaydeder ve sürekli QR üretmeye başlar.
5.  **Not:** Bu ID veritabanında tanımlı olmasa bile sistem çalışır ve QR üretir. Ancak tam raporlama için Admin panelden bu ID ile bir kayıt oluşturulması önerilir.

### 3.2. Kiosk Sıfırlama / Çıkış (Backdoor)
Bir cihazı Kiosk modundan çıkarmak ve ana sayfaya döndürmek için:
1.  Kiosk ekranındaki **Manuel Giriş (TC ile)** butonuna basılır.
2.  Gelen ekranda şu bilgiler girilir:
    - **TC No:** `00000000000` (11 adet sıfır)
    - **Şifre:** `0000` (4 adet sıfır)
3.  Giriş butonuna basıldığında onay sorar ve cihazı sıfırlar (Ana sayfaya atar).

## 4. Teknik Notlar

- **Socket.io:** Kiosk sayfası sürekli sunucuya Socket ile bağlıdır (`room_kiosk_KIOSKID`). Mobil uygulamadan `/api/mobile/scan` isteği başarılı olduğunda, sunucu o odaya `SCAN_SUCCESS` event'i yollar ve Kiosk ekranı yeşil olur/personel ismini gösterir.
- **Güvenlik:** `JWT_SECRET` anahtarı sunucuda saklıdır (`.env` dosyasında). Bu anahtar değiştirilirse tüm eski QR'lar geçersiz olur.
