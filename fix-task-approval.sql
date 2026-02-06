-- Fix RLS policies for task approval and payment flow

-- Drop and recreate all policies
DROP POLICY IF EXISTS "Allow update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow worker to update own task_assignment status" ON task_assignments;
DROP POLICY IF EXISTS "Allow public insert task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow select own task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow select task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow insert task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow update task_assignments" ON task_assignments;
DROP POLICY IF EXISTS "Allow update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
DROP POLICY IF EXISTS "Allow select own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow select notifications" ON notifications;
DROP POLICY IF EXISTS "Allow update notifications" ON notifications;

CREATE POLICY "Allow update profiles" ON profiles
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow select task_assignments" ON task_assignments
FOR SELECT USING (true);

CREATE POLICY "Allow insert task_assignments" ON task_assignments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update task_assignments" ON task_assignments
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update tasks" ON tasks
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select notifications" ON notifications
FOR SELECT USING (true);

CREATE POLICY "Allow update notifications" ON notifications
FOR UPDATE USING (true) WITH CHECK (true);

-- Create the process_task_payment function
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
BEGIN
  -- Get assignment and task details
  SELECT * INTO v_assignment FROM task_assignments WHERE id = p_assignment_id;
  SELECT * INTO v_task FROM tasks WHERE id = v_assignment.task_id;
  
  -- Update assignment status
  UPDATE task_assignments
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
      completed_at = NOW()
  WHERE id = p_assignment_id;
  
  -- Update task status
  UPDATE tasks
  SET status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END
  WHERE id = v_assignment.task_id;
  
  -- If approved, credit worker earnings
  IF p_approved THEN
    UPDATE profiles
    SET total_earnings = total_earnings + v_task.payout_amount,
        tasks_completed = tasks_completed + 1
    WHERE id = v_assignment.worker_id;
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


-- Create the handle_expired_tasks function
CREATE OR REPLACE FUNCTION handle_expired_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle expired assigned tasks (abandon and release back to available)
  WITH expired_assignments AS (
    UPDATE task_assignments
    SET status = 'abandoned'
    WHERE status IN ('accepted', 'in_progress')
    AND task_id IN (
      SELECT id FROM tasks 
      WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND status IN ('assigned', 'in_progress')
    )
    RETURNING id, task_id, worker_id
  )
  -- Notify workers about abandoned tasks
  INSERT INTO notifications (user_id, type, title, message, task_id)
  SELECT 
    worker_id,
    'system',
    'Task Expired',
    'Your assigned task has expired and been released back to the pool.',
    task_id
  FROM expired_assignments;

  -- Release tasks back to available
  UPDATE tasks
  SET status = 'available'
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND status IN ('assigned', 'in_progress');

  -- Cancel available tasks that expired without being assigned
  WITH cancelled_tasks AS (
    UPDATE tasks
    SET status = 'cancelled'
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status = 'available'
    RETURNING id, client_id, title
  )
  -- Notify clients about cancelled tasks
  INSERT INTO notifications (user_id, type, title, message, task_id)
  SELECT 
    client_id,
    'system',
    'Task Expired',
    'Your task "' || title || '" expired without being completed.',
    id
  FROM cancelled_tasks;
END;
$$;