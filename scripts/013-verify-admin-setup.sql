-- Verify the admin table and user were created correctly

-- Check if admin table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'admin';

-- Check admin user
SELECT id, username, created_at 
FROM admin;

-- Verify table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'admin'
ORDER BY ordinal_position;
