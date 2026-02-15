-- Add funding transaction hash column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS funding_tx_hash TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_funding_tx_hash ON tasks(funding_tx_hash);
