# TIRPORT Features Migration

## Overview
This migration adds all TIRPORT-level features to LogiTrack database.

**Type:** Additive only (No destructive changes)  
**Date:** 2026-02-04  
**Status:** Ready for production

## What's Added

### New Tables (10)
1. `companies` - Company management
2. `company_users` - User-company relationships
3. `loads` - Load marketplace postings
4. `bids` - Bidding system
5. `geofences` - Geographic zones
6. `geofence_events` - Entry/exit tracking
7. `documents` - Document management
8. `driver_scores` - Performance scoring
9. `messages` - In-app messaging
10. `invoices` - Billing system

### Modified Tables (4)
- `users` - Added `phone_number`
- `driver_profiles` - Added marketplace fields
- `vehicles` - Added enhanced specs
- `shipments` - Added `load_id` link

### New Enums (9)
- CompanyUserRole
- LoadStatus
- BidStatus
- VehicleTypeEnum
- GeofenceType
- GeofenceEventType
- EntityType
- DocumentType
- InvoiceStatus

## Safety Features

✅ Database name verification  
✅ IF NOT EXISTS checks  
✅ Cascade deletes configured  
✅ Indexes for performance  
✅ Auto-update triggers  
✅ Post-migration verification

## How to Apply

### Option 1: Via Prisma (Recommended)
```bash
cd backend
npx prisma db execute --file ./prisma/migrations/20260204_add_tirport_features/migration.sql
npx prisma generate
```

### Option 2: Direct PostgreSQL
```bash
psql -U postgres -d logitrack_db -f migration.sql
```

### Option 3: Docker
```bash
docker exec -i logitrack-postgres psql -U postgres -d logitrack_db < migration.sql
```

## Verification

After migration, verify:

```sql
-- Check new tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'loads', 'bids', 'geofences', 
                  'geofence_events', 'documents', 'driver_scores', 
                  'messages', 'invoices', 'company_users');

-- Should return 10 rows
```

## Rollback

If you need to rollback:

```bash
psql -U postgres -d logitrack_db -f rollback.sql
```

**WARNING:** Rollback will delete all TIRPORT data!

## Post-Migration Steps

1. Update Prisma Client:
   ```bash
   npx prisma generate
   ```

2. Restart backend:
   ```bash
   npm run start:dev
   ```

3. Test API endpoints:
   - `GET /api/companies`
   - `GET /api/marketplace/loads`
   - etc.

## Notes

- All changes are backward compatible
- Existing data is preserved
- No schema conflicts
- Production-safe

## Support

If migration fails:
1. Check logs for specific error
2. Verify database connection
3. Check PostgreSQL version (>= 12)
4. Contact: [Your contact]
