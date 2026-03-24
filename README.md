<p align="center">
  <img src="https://img.shields.io/badge/LogiTrack-System-0052CC?style=for-the-badge&logo=truck&logoColor=white" alt="LogiTrack" />
</p>

<h1 align="center">🚛 LogiTrack System</h1>

<p align="center">
  <strong>Modern, real-time logistics management platform</strong><br/>
  <em>Admin Dashboard · Driver Mobile App · NestJS Backend</em>
</p>

<p align="center">
  <a href="#türkçe">🇹🇷 Türkçe</a> &nbsp;•&nbsp;
  <a href="#english">🇬🇧 English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-000020?style=flat-square&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/PostGIS-336791?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
</p>

---

## <a id="türkçe"></a>🇹🇷 Türkçe

### 📌 Proje Hakkında

**LogiTrack System**, kurumsal lojistik operasyonlarını uçtan uca dijitalleştiren, gerçek zamanlı çalışan bir filo yönetim platformudur. Üç entegre bileşenden oluşur:

| Bileşen | Teknoloji | Açıklama |
|---|---|---|
| **Admin Dashboard** | Next.js 16 + TypeScript | Tüm operasyonların yönetildiği web yönetim paneli |
| **Driver Mobile App** | React Native + Expo | Sürücülerin kullandığı iOS/Android uygulaması |
| **Backend API** | NestJS + Prisma | RESTful API, WebSocket sunucusu ve iş mantığı katmanı |

---

### 🚀 Özellikler

#### 🗺️ Gerçek Zamanlı Takip
- Sürücü konumlarının canlı olarak harita üzerinde izlenmesi (PostGIS + Socket.io)
- MQTT tabanlı telemetri veri akışı
- Geofencing: Belirlenen bölgelere giriş/çıkış olaylarının otomatik tespiti

#### 📦 Gönderi Yönetimi
- Gönderi oluşturma, atama, durum takibi (PENDING → IN_TRANSIT → DELIVERED)
- Google Maps Directions API ile rota optimizasyonu
- QR kod & fotoğraf destekli teslim kanıtı sistemi
- Otomatik irsaliye (PDF) oluşturma

#### 👨‍💼 Sürücü Yönetimi
- Sürücü profili, ehliyet ve araç bilgileri
- Performans skorlaması (güvenlik, dakiklik, müşteri memnuniyeti)
- Vardiya yönetimi (ON_DUTY / OFF_DUTY)
- Kullanılabilirlik ve kapasite takibi

#### 🎫 Destek Sistemi
- Sürücüden admin'e bilet tabanlı destek akışı
- Gerçek zamanlı mesajlaşma (WebSocket)
- Öncelik seviyeleri: LOW / NORMAL / HIGH / URGENT
- Ticket durumu: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

#### 💬 Mesajlaşma & Bildirimler
- Admin–Sürücü birebir mesajlaşma
- Push notification (Expo Notification Service)
- Okunmamış mesaj sayacı ve okundu bilgisi

#### 🏢 Şirket & Faturalandırma
- Multi-tenant şirket yapısı
- Otomatik PDF fatura oluşturma
- Kredi limiti ve bakiye takibi

#### 🔒 Güvenlik & Altyapı
- JWT Access + Refresh Token mimarisi
- Role-Based Access Control (ADMIN, DISPATCHER, DRIVER, COMPANY_OWNER)
- Rate limiting (Throttler), Helmet, CORS koruması
- Redis tabanlı cache ve BullMQ iş kuyruğu
- Kapsamlı audit log sistemi
- Sentry entegrasyonu (hata takibi)
- Winston loglama

---

### 🏗️ Mimari

```
LogiTrack-System/
├── admin-dashboard/        # Next.js 16 yönetim paneli (port: 3001)
│   ├── app/               # App Router sayfaları
│   ├── components/        # UI bileşenleri (shadcn/ui tabanlı)
│   ├── contexts/          # React Context'leri (Auth, Socket)
│   └── hooks/             # Custom hook'lar
│
├── driver-mobile-app/      # React Native / Expo sürücü uygulaması
│   ├── app/               # Expo Router ekranları
│   ├── src/               # Redux store, slice'lar, servisler
│   ├── components/        # Yeniden kullanılabilir bileşenler
│   └── store/             # RTK Query + Redux Toolkit
│
├── backend/                # NestJS API sunucusu (port: 3000)
│   ├── src/
│   │   ├── auth/          # JWT kimlik doğrulama
│   │   ├── shipment/      # Gönderi CRUD & iş akışı
│   │   ├── driver/        # Sürücü yönetimi
│   │   ├── support/       # Destek bilet sistemi
│   │   ├── messaging/     # Mesajlaşma servisi
│   │   ├── location/      # Konum takibi
│   │   ├── geofencing/    # Coğrafi sınır yönetimi
│   │   ├── websocket/     # Socket.io gateway
│   │   ├── notification/  # Push bildirim servisi
│   │   ├── analytics/     # Raporlama & analitik
│   │   ├── billing/       # Fatura yönetimi
│   │   └── scoring/       # Sürücü performans skoru
│   └── prisma/            # Veritabanı şeması & migration
│
└── docker-compose.yml      # PostgreSQL, Redis, Mosquitto, Adminer
```

---

### 🛠️ Teknoloji Yığını

| Katman | Teknolojiler |
|---|---|
| **Backend** | NestJS, Prisma ORM, PostgreSQL + PostGIS, Redis, BullMQ, Socket.io, MQTT |
| **Admin Panel** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Leaflet |
| **Mobil Uygulama** | React Native 0.81, Expo 54, Redux Toolkit, RTK Query, Expo Router |
| **Altyapı** | Docker, Docker Compose, Sentry, Winston |
| **Kimlik Doğrulama** | JWT (access + refresh token), Passport.js, bcrypt |
| **Harita & Konum** | Google Maps Platform, PostGIS, react-native-maps |

---

### ⚡ Kurulum

#### Gereksinimler
- Node.js >= 18
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

#### 1. Repoyu klonlayın
```bash
git clone https://github.com/<kullanici-adi>/LogiTrack-System.git
cd LogiTrack-System
```

#### 2. Ortam değişkenlerini ayarlayın
```bash
cp .env.example .env
# .env dosyasını düzenleyin (veritabanı, JWT, Google Maps API key vb.)
```

#### 3. Docker ile altyapıyı başlatın
```bash
docker compose up -d
# PostgreSQL (5432), Redis (6379), Mosquitto (1883), Adminer (8080)
```

#### 4. Backend kurulumu
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed     # Opsiyonel: test verisi
npm run start:dev      # http://localhost:3000
```

#### 5. Admin Dashboard kurulumu
```bash
cd admin-dashboard
npm install
cp .env.local.example .env.local  # API URL'leri ayarlayın
npm run dev            # http://localhost:3001
```

#### 6. Mobil Uygulama kurulumu
```bash
cd driver-mobile-app
npm install
cp .env.example .env
node update-ip.js      # Yerel IP adresini otomatik ayarlar
npm run android        # veya: npm run ios
```

---

### 🔑 Ortam Değişkenleri

Gerekli ortam değişkenlerinin tam listesi için `.env.example` dosyasına bakın.

Kritik değişkenler:
- `DATABASE_URL` — PostgreSQL bağlantı dizisi
- `REDIS_URL` — Redis bağlantı dizisi
- `JWT_SECRET` — JWT imzalama anahtarı
- `GOOGLE_MAPS_API_KEY` — Harita ve rota optimizasyonu

---

### 📡 API Dokümantasyonu

Backend çalıştıktan sonra Swagger UI'a erişin:

```
http://localhost:3000/api/docs
```

---

### 🗄️ Veritabanı Şeması

Ana tablolar:

| Tablo | Açıklama |
|---|---|
| `users` | Tüm kullanıcılar (admin, dispatcher, sürücü) |
| `driver_profiles` | Sürücü profil ve konum bilgileri |
| `vehicles` | Araç envanteri |
| `shipments` | Gönderi ve teslimat kayıtları |
| `support_tickets` | Destek talepleri |
| `support_messages` | Bilet mesajları |
| `messages` | Genel mesajlaşma |
| `location_logs` | GPS konum geçmişi |
| `geofences` & `geofence_events` | Coğrafi sınır tanımları ve olaylar |
| `driver_scores` | Performans metrikleri |
| `invoices` | Fatura kayıtları |
| `audit_logs` | Sistem geneli işlem günlüğü |

---

## <a id="english"></a>🇬🇧 English

### 📌 About the Project

**LogiTrack System** is a production-grade, real-time fleet management platform that digitizes end-to-end logistics operations. It consists of three tightly integrated components:

| Component | Technology | Description |
|---|---|---|
| **Admin Dashboard** | Next.js 16 + TypeScript | Web management panel for fleet operators and dispatchers |
| **Driver Mobile App** | React Native + Expo | iOS/Android app for drivers |
| **Backend API** | NestJS + Prisma | RESTful API, WebSocket server, and business logic layer |

---

### 🚀 Features

#### 🗺️ Real-Time Tracking
- Live driver location monitoring on interactive maps (PostGIS + Socket.io)
- MQTT-based telemetry data pipeline
- Geofencing: automatic detection of entry/exit events at defined zones

#### 📦 Shipment Management
- Create, assign, and track shipments (PENDING → IN_TRANSIT → DELIVERED)
- Route optimization via Google Maps Directions API
- Delivery proof system with QR code and photo capture
- Automated waybill PDF generation

#### 👨‍💼 Driver Management
- Driver profiles with license and vehicle information
- Performance scoring (safety, punctuality, customer satisfaction)
- Shift management (ON_DUTY / OFF_DUTY)
- Availability and load capacity tracking

#### 🎫 Support Ticket System
- Driver-to-admin ticket-based support workflow
- Real-time messaging via WebSocket
- Priority levels: LOW / NORMAL / HIGH / URGENT
- Full ticket lifecycle: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

#### 💬 Messaging & Notifications
- Admin–Driver one-to-one messaging
- Push notifications via Expo Notification Service
- Unread message counter and read receipts

#### 🏢 Company & Billing
- Multi-tenant company structure
- Automated PDF invoice generation
- Credit limit and balance management

#### 🔒 Security & Infrastructure
- JWT Access + Refresh Token architecture
- Role-Based Access Control (ADMIN, DISPATCHER, DRIVER, COMPANY_OWNER)
- Rate limiting (Throttler), Helmet, CORS protection
- Redis-based caching and BullMQ job queue
- Comprehensive audit log system
- Sentry integration for error tracking
- Winston structured logging

---

### 🏗️ Architecture

```
LogiTrack-System/
├── admin-dashboard/        # Next.js 16 admin panel (port: 3001)
│   ├── app/               # App Router pages
│   ├── components/        # UI components (shadcn/ui based)
│   ├── contexts/          # React Contexts (Auth, Socket)
│   └── hooks/             # Custom hooks
│
├── driver-mobile-app/      # React Native / Expo driver app
│   ├── app/               # Expo Router screens
│   ├── src/               # Redux store, slices, services
│   ├── components/        # Reusable components
│   └── store/             # RTK Query + Redux Toolkit
│
├── backend/                # NestJS API server (port: 3000)
│   ├── src/
│   │   ├── auth/          # JWT authentication
│   │   ├── shipment/      # Shipment CRUD & workflow
│   │   ├── driver/        # Driver management
│   │   ├── support/       # Support ticket system
│   │   ├── messaging/     # Messaging service
│   │   ├── location/      # Location tracking
│   │   ├── geofencing/    # Geographic boundary management
│   │   ├── websocket/     # Socket.io gateway
│   │   ├── notification/  # Push notification service
│   │   ├── analytics/     # Reporting & analytics
│   │   ├── billing/       # Invoice management
│   │   └── scoring/       # Driver performance scoring
│   └── prisma/            # Database schema & migrations
│
└── docker-compose.yml      # PostgreSQL, Redis, Mosquitto, Adminer
```

---

### 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | NestJS, Prisma ORM, PostgreSQL + PostGIS, Redis, BullMQ, Socket.io, MQTT |
| **Admin Panel** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Leaflet |
| **Mobile App** | React Native 0.81, Expo 54, Redux Toolkit, RTK Query, Expo Router |
| **Infrastructure** | Docker, Docker Compose, Sentry, Winston |
| **Authentication** | JWT (access + refresh tokens), Passport.js, bcrypt |
| **Maps & Location** | Google Maps Platform, PostGIS, react-native-maps |

---

### ⚡ Getting Started

#### Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

#### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/LogiTrack-System.git
cd LogiTrack-System
```

#### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your values (database, JWT secret, Google Maps API key, etc.)
```

#### 3. Start infrastructure with Docker
```bash
docker compose up -d
# Starts: PostgreSQL (5432), Redis (6379), Mosquitto (1883), Adminer (8080)
```

#### 4. Backend setup
```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed     # Optional: seed with test data
npm run start:dev      # http://localhost:3000
```

#### 5. Admin Dashboard setup
```bash
cd admin-dashboard
npm install
cp .env.local.example .env.local  # Set API URLs
npm run dev            # http://localhost:3001
```

#### 6. Mobile App setup
```bash
cd driver-mobile-app
npm install
cp .env.example .env
node update-ip.js      # Auto-detects and sets your local IP address
npm run android        # or: npm run ios
```

---

### 🔑 Environment Variables

See `.env.example` at the project root for the full list of required variables.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — JWT signing key
- `GOOGLE_MAPS_API_KEY` — Maps and route optimization

---

### 📡 API Documentation

Once the backend is running, access Swagger UI at:

```
http://localhost:3000/api/docs
```

---

### 🗄️ Database Schema

Key tables:

| Table | Description |
|---|---|
| `users` | All users (admin, dispatcher, driver) |
| `driver_profiles` | Driver profiles with real-time location |
| `vehicles` | Vehicle inventory |
| `shipments` | Shipment and delivery records |
| `support_tickets` | Support requests |
| `support_messages` | Ticket conversation messages |
| `messages` | General messaging |
| `location_logs` | GPS location history |
| `geofences` & `geofence_events` | Geographic boundary definitions and events |
| `driver_scores` | Performance metrics |
| `invoices` | Billing records |
| `audit_logs` | System-wide action log |

---

### 🗂️ Project Structure Notes

- **`docker-compose.yml`** — Spins up PostgreSQL with PostGIS, Redis, Eclipse Mosquitto MQTT broker, and Adminer (database management UI)
- **`prisma/schema.prisma`** — Single source of truth for the entire data model
- **`.env.example`** — Template for all required environment variables; never commit `.env` files

---

### 📄 License

This project is private and proprietary. All rights reserved.

---

<p align="center">
  Built with ❤️ — LogiTrack System
</p>
