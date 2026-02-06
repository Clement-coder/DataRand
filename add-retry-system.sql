-- Add retry functionality to task_assignments

-- Add retry_count column if it doesn't exist
ALTER TABLE task_assignments 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Update the process_task_payment function to handle retries
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
  
  IF p_approved THEN
    -- Update task status to approved
    UPDATE tasks
    SET status = 'approved'
    WHERE id = v_assignment.task_id;
    
    -- Credit worker earnings
    UPDATE profiles
    SET total_earnings = total_earnings + v_task.payout_amount,
        tasks_completed = tasks_completed + 1
    WHERE id = v_assignment.worker_id;
  ELSE
    -- Rejection: check retry count
    IF v_assignment.retry_count >= 1 THEN
      -- Max retries reached, release to other workers
      UPDATE tasks
      SET status = 'available'
      WHERE id = v_assignment.task_id;
    ELSE
      -- Allow retry: keep task as submitted but mark assignment as rejected
      UPDATE tasks
      SET status = 'available'
      WHERE id = v_assignment.task_id;
    END IF;
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
