# 📟 DOKU Kiosk - Teknik Entegrasyon Rehberi

Bu doküman, Kiosk sisteminin çalışma mantığını, Mobil Uygulama (PWA) entegrasyonu ve API detaylarını açıklar.

## ⚙️ Sistem Çalışma Mantığı

1.  **Kiosk:** Sürekli değişen, imzalı JWT tabanlı bir QR kod üretir.
2.  **Mobil:** QR kodu tarar, içeriği doğrular ve sunucuya POST eder.
3.  **Sunucu:** Girişi doğrular, veritabanına işler ve Kiosk ekranına Real-time (Socket.io) sinyal gönderir.

---

## 📱 Mobil Uygulama Entegrasyonu

### 1. API Bilgileri
- **Endpoint:** `POST /kiosk/api/mobile/scan`
- **İçerik:** `application/json`

**Örnek JSON Body:**
```json
{
  "qr_token": "eyJhbGciOi...",      // Kiosk ekranındaki QR string
  "user_id": "17422776208",         // Kullanıcının TC No veya UUID'si
  "device_info": {                  // Opsiyonel güvenlik bilgileri
    "uuid": "device-uuid-123",
    "platform": "ios/android"
  }
}
```

### 2. QR Kod Yapısı (JWT Payload)
Uygulama QR kodu çözdüğünde şu verilere erişebilir:
- `kid`: Kiosk Benzersiz ID
- `nam`: Cihazın Görünür İsmi (Örn: "Ana Giriş Turnike")
- `iat`: Oluşturulma Zamanı (Unix Timestamp)

---

## 🧪 Test Verileri ve Senaryolar

### Test Kullanıcıları
| TC No | Şifre | Ad Soyad |
|-------|-------|----------|
| `17422776208` | `1742` | Test Kullanıcı 1 |
| `24400543608` | `2440` | Test Kullanıcı 2 |

### Başarılı Giriş Akışı
1. Mobil uygulama API'ye isteği gönderir.
2. Sunucu `200 OK` döner: `{ "success": true, "user_name": "..." }`.
3. Kiosk ekranı anlık olarak yeşile döner ve "Hoşgeldiniz" mesajı çıkar.

---

## 🛠️ Kiosk Cihaz Yönetimi

### Yeni Cihaz Kurulumu
1. Ana sayfadan **"Kiosk Modu"** butonuna basın.
2. Cihaza bir isim (Örn: "Laboratuvar Giriş") ve ID verin.
3. Cihaz yerel hafızaya bu bilgiyi kaydeder ve çalışmaya başlar.

### Kiosk Sıfırlama (Backdoor)
Yanlışlıkla kiosk moduna girilen bir cihazı kurtarmak için:
- **Manuel Giriş** ekranına gidin.
- **TC:** `00000000000` (11 adet sıfır)
- **Şifre:** `0000` (4 adet sıfır) girerek "Çıkış Yap" deyin.

---

## 📡 Real-time Haberleşme (Socket.io)

Kiosk ekranı `room_kiosk_[KIOSK_ID]` odasını dinler. 
- `SCAN_SUCCESS`: Giriş başarılı mesajı ve kullanıcı adı.
- `SCAN_ERROR`: Hata mesajı.

---
**Son Güncelleme:** 16.01.2026 01:40  
**Geliştirici Notu:** Backend tüm CORS ve Timeout testlerinden geçmiştir. 🟢
