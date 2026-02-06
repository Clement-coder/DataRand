-- Task Expiration Handler
-- Automatically handles expired tasks and assignments

-- Function to handle expired tasks
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

-- Enable pg_cron extension (run this as superuser or in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 5 minutes
-- SELECT cron.schedule(
--   'handle-expired-tasks',
--   '*/5 * * * *',
--   'SELECT handle_expired_tasks();'
-- );

-- For Supabase: Use Database Webhooks or Edge Functions instead
-- This is a manual trigger you can call from your app or set up as a webhook
