# LOGITRACK - TEKNİK TASARIM DOKÜMANI (TDD) v2.0 (React Native Edition)

## 1. PROJE ÖZETİ
LogiTrack; lojistik firmaları için saha (şoförler) ve merkez (operasyon) arasındaki veri akışını yöneten, gerçek zamanlı konum takibi ve operasyonel yönetim platformudur.

## 2. SİSTEM MİMARİSİ VE TEKNOLOJİLER

### A. Backend (Sunucu)
* **Framework:** NestJS (Modüler yapı).
* **Validation:** `class-validator` ve `class-transformer`.
* **Queue Management:** BullMQ (Redis tabanlı). Konum verilerini ve resim yüklemelerini asenkron işlemek için.
* **WebSockets:** Socket.io (NestJS Gateway) - Canlı takip için.

### B. Mobile App (Şoför)
* **Framework:** React Native (Expo managed workflow).
* **State Management:** Zustand (Global State) + TanStack Query (Server State & Caching).
* **Local Storage:** `react-native-mmkv` (En hızlı yerel depolama).
* **Maps:** `react-native-maps` (Google/Apple Maps native).
* **Background Tasks:** `expo-task-manager` ve `expo-background-fetch` (veya `react-native-background-geolocation`).
* **Form Management:** React Hook Form + Zod.

### C. Veritabanı Stratejisi
* **PostgreSQL:** İlişkisel veriler (Kullanıcı, Yük, Araç).
* **PostGIS:** Coğrafi sorgular (Hangi şoför hangi yükleme noktasına yakın? Alan ihlali var mı?).
* **Redis:** Anlık konum verilerinin önbelleği (Cache) ve İş Kuyrukları (Queue).

## 3. VERİTABANI ŞEMASI (Entity & Relations)

### Core Entities
* **User:** (`id`, `email`, `password`, `role` [ADMIN, DISPATCHER, DRIVER], `createdAt`)
* **DriverProfile:** (`userId`, `licenseNumber`, `vehicleId`, `currentStatus` [ACTIVE, OFF_DUTY])
* **Vehicle:** (`id`, `plateNumber`, `capacity`, `type`)

### Logistics Entities
* **Shipment:**
    * `id` (UUID)
    * `status` (PENDING, EN_ROUTE, DELIVERED, CANCELLED)
    * `pickupLocation` (PostGIS Geometry)
    * `deliveryLocation` (PostGIS Geometry)
    * `assignedDriverId` (FK)
    * `estimatedArrival` (DateTime)
    * `proofOfDelivery` (JSON - imzalı resim URL'i)

### Telemetry (High Volume)
* **LocationLog:**
    * `driverId`
    * `timestamp`
    * `coords` (PostGIS Point)
    * `heading` (Yön)
    * `speed` (Hız)
    * *Not:* Bu tablo, geçmişe dönük raporlama içindir. Canlı takip Redis üzerinden akar.

## 4. KRİTİK AKIŞLAR (WORKFLOWS)

### Akış 1: Offline-First Veri Senkronizasyonu
1.  **Senaryo:** Şoför tünelde, internet yok. "Teslim Ettim" butonuna bastı.
2.  **Mobile:** `TanStack Query` "mutation" işlemini yapar. İnternet olmadığı için işlem "paused" moda geçer. Veri `react-native-mmkv` içine, "pending_actions" kuyruğuna yazılır. UI'da kullanıcıya "Sırada bekliyor" ikonu gösterilir.
3.  **Sync:** İnternet geldiği anda (NetInfo listener), kuyruktaki veri NestJS API'ye gönderilir.

### Akış 2: Batarya Dostu Canlı Takip
1.  Şoför "Mesaiye Başla" der.
2.  Uygulama arka plan konum servisini başlatır.
3.  Eğer şoför duruyorsa (hız < 5km/s), GPS 5 dakikada bir ping atar.
4.  Eğer hareket halindeyse (hız > 20km/s), GPS 10 saniyede bir ping atar.
5.  Veriler MQTT veya Socket.io üzerinden sunucuya akar.

### Akış 3: OTA (Over-The-Air) Güncelleme
1.  Kritik bir hata tespit edildiğinde `eas update` komutu ile yeni JS bundle oluşturulur.
2.  Şoför uygulamayı bir sonraki açışında sessizce güncelleme iner.
3.  Uygulama yeniden başladığında güncel kod devreye girer.

## 5. API GÜVENLİĞİ
* Tüm endpointler **JWT Guard** ile korunur.
* Şoförler sadece kendilerine atanan `Shipment` verisini görebilir (Service katmanında kontrol).
* Rate Limiting (NestJS Throttler) uygulanarak API saldırıları engellenir.

```mermaid
graph TD
    subgraph Client_Side [Müşteri Tarafı]
        DriverApp["📱 Driver Mobile App<br/>(React Native + Offline DB)"]
        AdminPanel["💻 Admin Dashboard<br/>(Next.js / React)"]
    end

    subgraph Server_Side [NestJS Backend Ecosystem]
        APIGateway["🛡️ API Gateway / Load Balancer"]
        AuthService["🔐 Auth Service<br/>(JWT Strategy)"]
        LogisticsCore["📦 Logistics Core Module"]
        SocketServer["⚡ WebSocket Gateway<br/>(Canlı Takip)"]
    end

    subgraph Data_Layer [Veri Katmanı]
        Postgres[("🐘 PostgreSQL + PostGIS<br/>Ana Veritabanı")]
        Redis[("🔥 Redis<br/>Cache & Queue")]
    end

    %% Bağlantılar
    DriverApp -- REST API / HTTPS --> APIGateway
    DriverApp -- Socket.io / WSS --> SocketServer
    AdminPanel -- REST API / HTTPS --> APIGateway
    
    APIGateway --> AuthService
    APIGateway --> LogisticsCore
    
    LogisticsCore --> Postgres
    LogisticsCore --> Redis
    SocketServer --> Redis
    
    style DriverApp fill:#f9f,stroke:#333,stroke-width:2px
    style Postgres fill:#bbf,stroke:#333,stroke-width:2px
    style Redis fill:#d44,stroke:#333,stroke-width:2px,color:#fff