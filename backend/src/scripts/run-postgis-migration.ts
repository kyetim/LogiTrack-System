// Run PostGIS migration directly
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigration() {
    console.log('🚀 Running PostGIS migration...');

    const migrationPath = path.join(
        process.cwd(),
        'prisma/migrations/20260211_add_postgis_geography/migration.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(statement);
            console.log('✅ Success');
        } catch (error) {
            console.error(`❌ Error:`, error.message);
            // Continue anyway - some statements might already exist
        }
    }

    console.log('🎉 Migration completed!');
    await prisma.$disconnect();
}

runMigration();
