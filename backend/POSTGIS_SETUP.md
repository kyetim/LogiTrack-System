# PostGIS Installation Guide

## Problem
PostgreSQL database doesn't have PostGIS extension installed, which is required for geospatial queries (Smart Job Matching feature).

## Option 1: Install PostGIS (Recommended)

### Step 1: Check PostgreSQL Version
Open pgAdmin or command line and run:
```sql
SELECT version();
```

### Step 2: Download PostGIS
Visit: https://postgis.net/windows_downloads/
Download the installer matching your PostgreSQL version (14, 15, etc.)

### Step 3: Run Installer
- Run the downloaded .exe file
- It will automatically detect and install to your PostgreSQL

### Step 4: Enable in Database
In pgAdmin Query Tool or psql:
```sql
CREATE EXTENSION postgis;
```

### Step 5: Run Migration
```powershell
cd C:\Users\TERM\Desktop\LogiTrack-System\backend
node scripts/add-location-columns.js
```

---

## Option 2: Temporary Workaround (Without PostGIS)

Use JSON columns instead of geography types. Run this in pgAdmin:

```sql
ALTER TABLE driver_profiles 
ADD COLUMN IF NOT EXISTS current_location_json JSON,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_available_for_work BOOLEAN DEFAULT false;

ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS pickup_location_json JSON,
ADD COLUMN IF NOT EXISTS delivery_location_json JSON;
```

⚠️ **Note:** This will disable proximity search features. Smart matching won't work optimally.

---

## Recommended: Install PostGIS for full functionality
