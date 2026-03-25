Akış 1: Offline-First Veri Senkronizasyonu
Şoförün interneti kesilse bile operasyonun durmaması için "Store & Forward" (Sakla ve İlet) mimarisi kullanılır.

sequenceDiagram
    participant Driver as 🚚 Şoför
    participant App as 📱 Mobil App (Local DB)
    participant API as ☁️ NestJS Backend
    participant DB as 🐘 Veritabanı

    Note over Driver, App: Şoför "Teslim Ettim" butonuna basar
    Driver->>App: "Teslimat Tamamla (İmza + Foto)"
    
    alt İnternet VARSA
        App->>API: POST /shipments/complete (Data)
        API->>DB: Update Status & Save File
        DB-->>API: Success
        API-->>App: "200 OK (Yeşil Tik)"
    else İnternet YOKSA (Offline Mod)
        App->>App: "Veriyi Yerel DB'ye (AsyncStorage) Kaydet 💾"
        App-->>Driver: "Kuyruğa Eklendi, Bekliyor (Sarı İkon)"
        
        loop Arka Plan Servisi
            App->>App: İnternet Bağlantısını Kontrol Et...
        end
        
        Note over App, API: Bağlantı Geldi! 📶
        App->>API: "POST /shipments/sync (Toplu Veri)"
        API->>DB: Tüm kuyruğu işle
        API-->>App: "200 OK (Senkronize Oldu)"
        App-->>Driver: "Tüm Veriler Gönderildi (Yeşil Tik)"
    end


Akış 2: Batarya Dostu Canlı Takip

Dururken: Hız < 5km/s ise GPS sadece 5 dakikada bir ping atar.

Hareketliyken: Hız > 20km/s ise GPS 10 saniyede bir ping atar.

İletişim: Veriler Socket.io veya MQTT üzerinden hafif paketler halinde sunucuya akar ve Redis'te önbelleklenir.
