-- Function to delete user account and all associated data
-- This permanently removes all user data from the database

CREATE OR REPLACE FUNCTION delete_user_account(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all user data in order (respecting foreign key constraints)
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = p_profile_id;
  
  -- Delete transactions
  DELETE FROM transactions WHERE profile_id = p_profile_id;
  
  -- Delete withdrawal requests
  DELETE FROM withdrawal_requests WHERE profile_id = p_profile_id;
  
  -- Delete task assignments (as worker)
  DELETE FROM task_assignments WHERE worker_id = p_profile_id;
  
  -- Delete tasks created by user (as client)
  -- This will cascade delete related task_assignments
  DELETE FROM tasks WHERE client_id = p_profile_id;
  
  -- Delete compute sessions
  DELETE FROM compute_sessions WHERE profile_id = p_profile_id;
  
  -- Finally, delete the profile
  DELETE FROM profiles WHERE id = p_profile_id;
  
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
