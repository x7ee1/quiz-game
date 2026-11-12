-- Rotate the admin password locally. Do not commit the bcrypt hash.
-- Generate one with: node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "your-password"
-- UPDATE admin
-- SET password_hash = 'REPLACE_WITH_BCRYPT_HASH', updated_at = NOW()
-- WHERE username = 'admin';

SELECT id, username, created_at, updated_at
FROM admin
WHERE username = 'admin';
