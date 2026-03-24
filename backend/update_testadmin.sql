-- Update testadmin password to "admin123"
UPDATE users 
SET password_hash = '$2b$10$hjoxyD9r/ldbdgWkABY6yOouBuWSpFZHM8M5tQULXvRVWa.NSboum'
WHERE email = 'testadmin@logitrack.com';
