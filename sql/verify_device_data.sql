-- Verify Real Device Data is Being Stored in Database
-- Run this in Supabase SQL Editor to see all registered devices

-- 1. Check all devices with their real specs
SELECT 
  cd.id,
  cd.device_name,
  cd.device_type,
  cd.ram_gb as "RAM (GB)",
  cd.cpu_cores as "CPU Cores",
  cd.storage_gb as "Storage (GB)",
  cd.compute_score as "Compute Score",
  cd.is_active as "Active",
  cd.last_seen as "Last Seen",
  p.email as "User Email"
FROM compute_devices cd
LEFT JOIN profiles p ON cd.user_id = p.id
ORDER BY cd.last_seen DESC;

-- 2. Check network aggregation (what enterprises see)
SELECT * FROM get_network_stats();

-- 3. Check active devices (last 5 minutes)
SELECT 
  device_name,
  device_type,
  ram_gb,
  cpu_cores,
  storage_gb,
  compute_score,
  last_seen
FROM compute_devices
WHERE is_active = true
  AND last_seen > now() - interval '5 minutes'
ORDER BY last_seen DESC;

-- 4. Check compute sessions (earnings data)
SELECT 
  cs.id,
  cs.device_type,
  cs.started_at,
  cs.ended_at,
  cs.total_earned,
  cs.earnings_rate,
  p.email
FROM compute_sessions cs
LEFT JOIN profiles p ON cs.worker_id = p.id
ORDER BY cs.started_at DESC
LIMIT 10;
