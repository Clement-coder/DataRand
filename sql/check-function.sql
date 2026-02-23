-- Run this in Supabase SQL Editor to check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'delete_user_account';

-- If it doesn't exist, run the function below:
-- (Copy from sql/14_delete_user_account_function.sql)
