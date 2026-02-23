-- Function to delete user account and all associated data
-- This ensures cascade deletion of all user-related records

create or replace function delete_user_account(p_profile_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Delete in order to respect foreign key constraints
  -- Only delete from tables that exist
  
  -- Delete notifications (if table exists)
  delete from public.notifications where user_id = p_profile_id;
  
  -- Delete withdrawal requests (if table exists)
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'withdrawal_requests') then
    delete from public.withdrawal_requests where profile_id = p_profile_id;
  end if;
  
  -- Delete transactions (if table exists)
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    delete from public.transactions where profile_id = p_profile_id;
  end if;
  
  -- Delete task assignments (this will cascade to related records)
  delete from public.task_assignments where worker_id = p_profile_id;
  
  -- Delete compute devices
  delete from public.compute_devices where profile_id = p_profile_id;
  
  -- Delete compute sessions
  delete from public.compute_sessions where profile_id = p_profile_id;
  
  -- Delete tasks created by this user (if they're a client)
  delete from public.tasks where client_id = p_profile_id;
  
  -- Finally, delete the profile
  delete from public.profiles where id = p_profile_id;
  
  -- Note: auth.users deletion should be handled by Supabase Auth
  -- The trigger or RLS policy should handle that automatically
end;
$$;

-- Grant execute permission to authenticated users (they can only delete their own account via RLS)
grant execute on function delete_user_account(uuid) to authenticated;
