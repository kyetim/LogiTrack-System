const bcrypt = require('bcrypt');

async function hashPassword() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nSQL to update:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'testadmin@logitrack.com';`);
}

hashPassword();
