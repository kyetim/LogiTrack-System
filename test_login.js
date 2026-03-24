async function testFullLogin() {
    // 1. Login and get token
    console.log('Step 1: Testing auth/login...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@driver.com', password: 'driver123' })
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok) {
        console.error('Login failed:', loginData);
        return;
    }

    console.log('Login success! token:', loginData.access_token?.substring(0, 30) + '...');

    // 2. Fetch driver profile
    console.log('Step 2: Testing drivers/me...');
    const profileRes = await fetch('http://localhost:3000/api/drivers/me', {
        headers: { 'Authorization': `Bearer ${loginData.access_token}` }
    });
    const profileData = await profileRes.json();

    if (!profileRes.ok) {
        console.error('Profile fetch failed:', profileData);
        return;
    }

    console.log('Profile success!', profileData);
}

testFullLogin().catch(console.error);
