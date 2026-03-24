# LogiTrack — Local Development Setup

## Prerequisites

- **Node.js** >= 18
- **Docker** & Docker Compose
- **Expo CLI** (`npm install -g expo-cli`)
- A physical Android/iOS device or emulator

---

## Step 1 — Clone & Configure Environment

```bash
git clone https://github.com/<your-username>/LogiTrack-System.git
cd LogiTrack-System

# Copy environment template
cp .env.example .env
# Edit .env with your values (see "Environment Variables" section in README)
```

---

## Step 2 — Start Infrastructure (Docker)

```bash
docker compose up -d
```

| Service | URL / Port |
|---|---|
| PostgreSQL + PostGIS | `localhost:5432` |
| Redis | `localhost:6379` |
| Mosquitto MQTT | `localhost:1883` |
| Adminer (DB UI) | `http://localhost:8080` |

```bash
# Check all containers are healthy
docker compose ps

# View logs
docker compose logs -f
```

---

## Step 3 — Backend

```bash
cd backend
npm install

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed with test data
npx prisma db seed

# Start development server
npm run start:dev
# → http://localhost:3000
# → Swagger UI: http://localhost:3000/api/docs
```

---

## Step 4 — Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
# → http://localhost:3001
```

---

## Step 5 — Driver Mobile App

```bash
cd driver-mobile-app
npm install

# Auto-detect and set your local IP address
node update-ip.js

# Start on Android
npm run android

# Start on iOS
npm run ios
```

> **Note:** The `update-ip.js` script automatically writes your machine's local IP into the `.env` file so the mobile app can reach the backend on your local network.

---

## Stopping Services

```bash
# Stop Docker containers
docker compose down

# Stop and remove all data volumes (WARNING: deletes database)
docker compose down -v
```

---

## Default Credentials (Development Only)

These values are set in `.env.example` for local development. **Change all of them before any deployment.**

| Service | Value |
|---|---|
| PostgreSQL user | `logitrack_user` |
| PostgreSQL password | `logitrack_password` |
| PostgreSQL database | `logitrack_db` |

---

## Prisma Commands Reference

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations (CI/production)
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser)
npx prisma studio
```
