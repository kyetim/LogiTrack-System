# PostGIS Kurulum Rehberi

## Sorun
PostgreSQL veritabanında PostGIS extension'ı yüklü değil. Smart Job Matching özelliği için gerekli olan coğrafi sorgular (proximity search) için PostGIS gereklidir.

## Seçenek 1: PostGIS Kurulumu (Önerilen)

### Adım 1: PostgreSQL Sürümünüzü Kontrol Edin
pgAdmin veya komut satırında şu komutu çalıştırın:
```sql
SELECT version();
```

### Adım 2: PostGIS İndir
Buradan indirin: https://postgis.net/windows_downloads/
PostgreSQL sürümünüze uygun installer'ı seçin (14, 15, vb.)

### Adım 3: Installer'ı Çalıştırın
- İndirdiğiniz .exe dosyasını çalıştırın
- PostgreSQL'inizi otomatik olarak algılayıp kurulum yapacaktır

### Adım 4: Veritabanında Etkinleştirin
pgAdmin Query Tool veya psql'de şu komutu çalıştırın:
```sql
CREATE EXTENSION postgis;
```

### Adım 5: Migration Script'ini Çalıştırın
```powershell
cd C:\Users\TERM\Desktop\LogiTrack-System\backend
node scripts/add-location-columns.js
```

**Başarılı kurulumda şu çıktıyı göreceksiniz:**
```
✅ PostGIS extension enabled
✅ Driver profile columns added
✅ Shipment location columns added
✅ Created driver location index
✅ Created shipment pickup location index
✅ Created shipment delivery location index
🎉 Migration completed successfully!
```

---

## Seçenek 2: Geçici Çözüm (PostGIS Olmadan)

Coğrafi fonksiyonlar yerine JSON kolonları kullanın. pgAdmin'de şunu çalıştırın:

```sql
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS current_location_json JSON,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_available_for_work BOOLEAN DEFAULT false;

ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS pickup_location_json JSON,
ADD COLUMN IF NOT EXISTS delivery_location_json JSON;
```

⚠️ **Uyarı:** Bu yöntemle:
- Proximity search (yakınlık araması) çalışmaz
- Smart job matching optimal çalışmaz
- Sadece temel işlevler kullanılabilir

---

## Öneri: Tam İşlevsellik İçin PostGIS Kurun

Smart Job Matching özelliğinin aşağıdaki fonksiyonları PostGIS gerektirir:
- ✅ 50km yarıçapında yakın işleri bulma
- ✅ Sürücü-iş mesafe hesaplama
- ✅ Gerçek zamanlı konum takibi
- ✅ Coğrafi index'ler ile hızlı sorgulama

**Production ortamı için PostGIS kurulumu şarttır!**
