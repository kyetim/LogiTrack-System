# PostgreSQL ve PostGIS Kurulum - Komple Rehber

## 📋 Mevcut Durum Özeti

✅ **Backend zaten çalışıyor!** Bu PostgreSQL'in bir şekilde kurulu olduğunu gösteriyor.

### Veritabanı Bilgileriniz (.env dosyasından):
```
Kullanıcı Adı: logitrack_user
Şifre: logitrack_password
Veritabanı: logitrack_db
Host: localhost
Port: 5432
```

**DATABASE_URL:**
```
postgresql://logitrack_user:logitrack_password@localhost:5432/logitrack_db
```

---

## 🔍 PostgreSQL Kurulu Mu Kontrol Edelim

### Yöntem 1: Windows Services Kontrolü
1. `Windows + R` tuşuna basın
2. `services.msc` yazıp Enter
3. Listede "postgresql" ara
4. Varsa → PostgreSQL kurulu, sadece PostGIS eklememiz gerekiyor
5. Yoksa → PostgreSQL kurulumu yapmalıyız

### Yöntem 2: Komut Satırı
PowerShell'de:
```powershell
Get-Service | Select-String postgres
```

---

## 🛠️ Senaryo 1: PostgreSQL Kurulu (Muhtemelen Bu)

Backend çalıştığına göre PostgreSQL muhtemelen kurulu. Sadece PostGIS eklememiz gerekiyor:

### Adım 1: PostgreSQL Kurulum Klasörünü Bulun
Genellikle:
```
C:\Program Files\PostgreSQL\15\
veya
C:\Program Files\PostgreSQL\14\
```

### Adım 2: pgAdmin'i Açın
- Başlat menüsünden "pgAdmin" ara
- Açılınca "Servers" → "PostgreSQL" genişlet
- Master password istenirse **bilmiyoruz** - sonra sıfırlarız

### Adım 3: PostGIS İndir ve Kur
1. https://postgis.net/windows_downloads/
2. PostgreSQL sürümünüze uygun olanı indir
3. .exe dosyasını çalıştır (otomatik kurulum)

### Adım 4: Extension Etkinleştir
pgAdmin Query Tool'da:
```sql
CREATE EXTENSION postgis;
```

### Adım 5: Migration Çalıştır
```powershell
cd C:\Users\TERM\Desktop\LogiTrack-System\backend
node scripts/add-location-columns.js
```

---

## 🆕 Senaryo 2: PostgreSQL Kurulu Değil (Pek Olası Değil)

Backend çalışıyor, bu yüzden PostgreSQL kesinlikle kurulu. Ama yine de kurulum adımları:

### PostgreSQL Kurulumu
1. https://www.postgresql.org/download/windows/
2. "Download the installer" → En son sürümü indir
3. Installer'ı çalıştır:
   - Port: 5432 (varsayılan)
   - Superuser (postgres) şifresi: **kaydet!**
   - Stack Builder: PostGIS'i seçmek için "Yes"

4. Stack Builder'da:
   - Spatial Extensions → PostGIS seç
   - Kur

---

## 🔐 Şifre Sıfırlama (Gerekirse)

### pgAdmin Master Password Sıfırlama
1. pgAdmin'i kapat
2. Şu dosyayı sil:
   ```
   C:\Users\TERM\AppData\Roaming\pgAdmin\pgadmin4.db
   ```
3. pgAdmin'i tekrar aç, yeni master password belirle

### PostgreSQL postgres Kullanıcı Şifresi
Eğer unuttuysanız:
```powershell
# Windows hizmetlerinden PostgreSQL'i restart
Restart-Service postgresql-x64-15  # Sürüm numaranıza göre değişir
```

---

## ✅ Test Et

Migration başarılı olursa göreceksiniz:
```
🔄 Enabling PostGIS extension...
✅ PostGIS extension enabled
✅ Driver profile columns added
✅ Shipment location columns added
✅ Created driver location index
🎉 Migration completed successfully!
```

---

## 🚨 Hızlı Çözüm

En hızlı yol:
1. pgAdmin'i aç (muhtemelen zaten kurulu)
2. Query Tool'da: `CREATE EXTENSION postgis;`
3. Terminal'de: `node scripts/add-location-columns.js`
4. Backend'i restart et

**İşte bu kadar!**
