-- DataRand Platform Fee and Account Deletion Updates
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Update process_task_payment to record platform fees
-- ============================================

CREATE OR REPLACE FUNCTION process_task_payment(
  p_assignment_id UUID,
  p_approved BOOLEAN,
  p_feedback TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment task_assignments%ROWTYPE;
  v_task tasks%ROWTYPE;
  v_platform_fee DECIMAL;
  v_education_fund DECIMAL;
BEGIN
  -- Get assignment and task details
  SELECT * INTO v_assignment FROM task_assignments WHERE id = p_assignment_id;
  SELECT * INTO v_task FROM tasks WHERE id = v_assignment.task_id;
  
  -- Calculate fees (15% platform fee)
  v_platform_fee := v_task.payout_amount * 0.15;
  v_education_fund := v_task.payout_amount * 0.15;
  
  -- Update assignment status
  UPDATE task_assignments
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      completed_at = NOW()
  WHERE id = p_assignment_id;
  
  -- Update task status
  UPDATE tasks
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END
  WHERE id = v_assignment.task_id;
  
  -- If approved, credit worker earnings and record transactions
  IF p_approved THEN
    UPDATE profiles
    SET total_earnings = total_earnings + v_task.payout_amount,
        tasks_completed = tasks_completed + 1
    WHERE id = v_assignment.worker_id;
    
    -- Record worker earning transaction
    INSERT INTO transactions (profile_id, amount, type, description, status, task_assignment_id)
    VALUES (v_assignment.worker_id, v_task.payout_amount, 'earning', 'Task completion payment', 'completed', p_assignment_id);
    
    -- Record platform fee transaction
    INSERT INTO transactions (profile_id, amount, type, description, status, task_assignment_id)
    VALUES (v_task.client_id, -v_platform_fee, 'platform_fee', 'Platform fee (15%)', 'completed', p_assignment_id);
    
    -- Record education fund transaction
    INSERT INTO transactions (profile_id, amount, type, description, status, task_assignment_id)
    VALUES (v_assignment.worker_id, -v_education_fund, 'education_fund', 'Education fund contribution (15%)', 'completed', p_assignment_id);
  END IF;
  
  -- Notify worker
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (
    v_assignment.worker_id,
    CASE WHEN p_approved THEN 'task_approved' ELSE 'task_rejected' END,
    CASE WHEN p_approved THEN 'Task Approved!' ELSE 'Task Rejected' END,
    COALESCE(p_feedback, CASE WHEN p_approved THEN 'Your work has been approved and payment released.' ELSE 'Your submission was rejected.' END),
    v_assignment.task_id
  );
  
  -- Notify client
  INSERT INTO notifications (user_id, type, title, message, task_id)
  VALUES (
    v_task.client_id,
    'system',
    CASE WHEN p_approved THEN 'Task Completed' ELSE 'Task Rejected' END,
    CASE WHEN p_approved THEN 'You approved a task submission.' ELSE 'You rejected a task submission.' END,
    v_assignment.task_id
  );
END;
$$;

-- ============================================
-- 2. Create delete_user_account function
-- ============================================

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
  
  -- Delete withdrawal requests (if table exists)
  DELETE FROM withdrawal_requests WHERE profile_id = p_profile_id;
  
  -- Delete task assignments (as worker)
  DELETE FROM task_assignments WHERE worker_id = p_profile_id;
  
  -- Delete tasks created by user (as client)
  -- This will cascade delete related task_assignments
  DELETE FROM tasks WHERE client_id = p_profile_id;
  
  -- Delete compute sessions (if table exists)
  DELETE FROM compute_sessions WHERE profile_id = p_profile_id;
  
  -- Finally, delete the profile
  DELETE FROM profiles WHERE id = p_profile_id;
  
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- ============================================
-- Summary of Changes
-- ============================================
-- 1. Updated process_task_payment to:
--    - Calculate 15% platform fee
--    - Calculate 15% education fund contribution
--    - Record all transactions (earning, platform_fee, education_fund)
--
-- 2. Created delete_user_account function to:
--    - Delete all user data (notifications, transactions, tasks, etc.)
--    - Permanently remove user profile
--    - Respect foreign key constraints
