const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const email = 'superadmin@logitrack.com';
        const password = 'admin123';

        // Generate bcrypt hash
        const passwordHash = await bcrypt.hash(password, 10);

        console.log('🔐 Creating admin user...');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Hash length:', passwordHash.length);

        // Delete if exists
        await prisma.user.deleteMany({
            where: { email }
        });

        // Create new admin user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: 'ADMIN',
                firstName: 'Super',
                lastName: 'Admin',
                phone: '+1234567890',
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('User ID:', user.id);
        console.log('\n📋 Login credentials:');
        console.log('Email:', email);
        console.log('Password:', password);

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
