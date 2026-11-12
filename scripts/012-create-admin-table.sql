-- Drop the admin table if it exists to ensure a clean slate
DROP TABLE IF EXISTS admin CASCADE;

-- Create admin table for simple authentication
CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Will store bcrypt hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the single admin user locally. Do not commit the bcrypt hash.
-- Generate one with: node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "your-password"
-- INSERT INTO admin (username, password_hash) VALUES ('admin', 'REPLACE_WITH_BCRYPT_HASH');

-- Verify the admin user was created
SELECT 'Admin table created:' as status;
SELECT id, username, created_at FROM admin;
