# 🚀 LogiTrack Backend - Setup Guide

## 📋 Prerequisites
- Node.js 18+ installed
- Docker & Docker Compose installed
- npm or yarn package manager

## 🐳 Step 1: Start Docker Services

```bash
# Start all services (PostgreSQL, Redis, PgAdmin, Adminer)
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Access Points:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- PgAdmin: `http://localhost:5050` (admin@logitrack.com / admin123)
- Adminer: `http://localhost:8080`

## 📦 Step 2: Initialize NestJS Project

```bash
# Install NestJS CLI globally (if not already installed)
npm install -g @nestjs/cli

# Create new NestJS project (if starting fresh)
# nest new backend --package-manager npm

# Or navigate to backend directory
cd backend
```

## 🔧 Step 3: Install Core Dependencies

### Core NestJS & Framework
```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config
npm install @nestjs/throttler
```

### Database & ORM (Prisma)
```bash
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init
```

### Validation & Transformation
```bash
npm install class-validator class-transformer
```

### Authentication & Security
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install -D @types/bcrypt @types/passport-jwt
```

### Redis & Caching
```bash
npm install @nestjs/cache-manager cache-manager
npm install ioredis
npm install -D @types/ioredis
```

### BullMQ (Job Queue)
```bash
npm install @nestjs/bullmq bullmq
```

### WebSocket (Socket.io)
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install socket.io
```

### Utilities
```bash
npm install uuid
npm install -D @types/uuid
```

## 📝 Step 4: Create .env File

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
# (The default values should work for local development)
```

## 🗄️ Step 5: Setup Prisma Schema

```bash
# After creating your Prisma schema, generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

## ✅ Step 6: Verify Installation

```bash
# Start NestJS development server
npm run start:dev

# Server should start on http://localhost:3000
```

## 🧪 Testing Database Connection

### Using PgAdmin (http://localhost:5050)
1. Login with: admin@logitrack.com / admin123
2. Add New Server:
   - Name: LogiTrack
   - Host: postgres (or localhost if connecting from host machine)
   - Port: 5432
   - Username: logitrack_user
   - Password: logitrack_password

### Using Adminer (http://localhost:8080)
1. System: PostgreSQL
2. Server: postgres (or localhost)
3. Username: logitrack_user
4. Password: logitrack_password
5. Database: logitrack_db

## 🛑 Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## 📚 Next Steps
1. Create Prisma schema based on `VERİTABANI VE İLİŞKİ ŞEMASI.md`
2. Generate Prisma migrations
3. Create NestJS modules (Auth, User, Shipment, Location, etc.)
4. Implement JWT authentication
5. Setup WebSocket gateway for real-time tracking
6. Configure BullMQ for async jobs

---

**Note:** All default passwords are for development only. Change them in production!
