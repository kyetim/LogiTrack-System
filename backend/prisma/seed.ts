import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@logitrack.com';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash,
            role: UserRole.ADMIN,
            accountStatus: AccountStatus.ACTIVE,
            firstName: 'System',
            lastName: 'Admin'
        },
    });

    console.log('✅ Admin user provisioned:');
    console.log(`✉️ Email:  ${admin.email}`);
    console.log(`🔑 Pass:   ${password}`);
    console.log(`🛡️ Role:   ${admin.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
