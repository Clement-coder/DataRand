# ComputeShare Toggle Fix

## 🐛 Issue Found
The backend was using `req.user.profileId` but the auth middleware sets `req.user.id`.

## ✅ Fixed
Changed all network controller methods to use `req.user.id`:
- `registerDevice` 
- `sendHeartbeat`
- `deactivateDevice`
- `getUserDevices`

## 🔄 What Happens Now

### When You Toggle ComputeShare ON:

1. **Frontend** detects device specs (RAM, CPU, Storage)
2. **Frontend** calls `/api/v1/network/devices/register` with auth token
3. **Backend** receives request with correct user ID
4. **Backend** inserts/updates device in `compute_devices` table:
   ```sql
   INSERT INTO compute_devices (
     user_id,
     device_name,
     device_type,
     ram_gb,
     cpu_cores,
     storage_gb,
     is_active,
     last_seen
   ) VALUES (...)
   ```
5. **Backend** returns device ID
6. **Frontend** starts heartbeat (updates every 90 seconds)
7. **Network Stats** updates automatically via `get_network_stats()` function

### Database Updates:
- ✅ Device registered in `compute_devices` table
- ✅ `is_active = true`
- ✅ `last_seen` timestamp updated
- ✅ Compute score calculated automatically (trigger)
- ✅ Network stats aggregated in real-time

### Network Power Grid:
The grid shows aggregated stats from ALL active devices:
```sql
SELECT 
  COUNT(*) as active_nodes,
  SUM(ram_gb) as total_ram_gb,
  SUM(cpu_cores) as total_cpu_cores,
  SUM(storage_gb) as total_storage_gb,
  SUM(compute_score) as total_compute_score
FROM compute_devices
WHERE is_active = true 
  AND last_seen > NOW() - INTERVAL '5 minutes'
```

## 🚀 Next Steps

1. **Render will auto-deploy** the backend fix (takes ~2-3 minutes)
2. **Run SQL in Supabase** (if not done yet):
   - Go to Supabase SQL Editor
   - Run `sql/16_complete_deployment.sql`
3. **Test ComputeShare**:
   - Toggle ON
   - Check browser console for "✅ Device registered"
   - Check Supabase `compute_devices` table
   - Check Network Power stats update

## 🔍 Debugging

If still not working, check:

1. **Browser Console**: Look for registration success/error
2. **Supabase Logs**: Check for insert errors
3. **Backend Logs**: Check Render logs for errors
4. **Auth Token**: Verify localStorage has `datarand_token`

## ✅ Expected Result

After toggle ON:
- Device appears in `compute_devices` table
- Network Power shows: 1 active node, your RAM/CPU/Storage
- Heartbeat updates every 90 seconds
- Stats persist across page refreshes
