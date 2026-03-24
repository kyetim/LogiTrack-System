const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enablePostGIS() {
    try {
        console.log('🔄 Enabling PostGIS extension...');

        // Enable PostGIS extension
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        console.log('✅ PostGIS extension enabled');

        console.log('🔄 Adding location tracking columns...');

        // Add columns to driver_profiles
        await prisma.$executeRawUnsafe(`
            ALTER TABLE driver_profiles 
            ADD COLUMN IF NOT EXISTS current_location geography(Point,4326),
            ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
            ADD COLUMN IF NOT EXISTS is_available_for_work BOOLEAN DEFAULT false;
        `);
        console.log('✅ Driver profile columns added');

        // Add columns to shipments
        await prisma.$executeRawUnsafe(`
            ALTER TABLE shipments
            ADD COLUMN IF NOT EXISTS pickup_location geography(Point,4326),
            ADD COLUMN IF NOT EXISTS delivery_location geography(Point,4326);
        `);
        console.log('✅ Shipment location columns added');

        // Create spatial indexes with proper operator classes
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_driver_current_location ON driver_profiles USING GIST(current_location);
        `);
        console.log('✅ Created driver location index');

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_shipment_pickup_location ON shipments USING GIST(pickup_location);
        `);
        console.log('✅ Created shipment pickup location index');

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_shipment_delivery_location ON shipments USING GIST(delivery_location);
        `);
        console.log('✅ Created shipment delivery location index');

        console.log('🎉 Migration completed successfully!');
        console.log('📍 PostGIS is now enabled for Smart Job Matching!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

enablePostGIS()
    .then(() => {
        console.log('✅ Done! You can now restart the backend.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error.message);
        process.exit(1);
    });
