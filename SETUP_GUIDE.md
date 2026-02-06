# Quick Setup Guide

## Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `platform-fee-and-delete-account.sql`
4. Click "Run" to execute

## Step 2: Verify Changes

### Check Functions Exist:
```sql
-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('process_task_payment', 'delete_user_account');
```

### Test Platform Fee Recording:
```sql
-- After approving a task, check transactions
SELECT * FROM transactions 
WHERE task_assignment_id = 'YOUR_ASSIGNMENT_ID'
ORDER BY created_at DESC;

-- Should see 3 transactions:
-- 1. earning (positive amount)
-- 2. platform_fee (negative amount, 15%)
-- 3. education_fund (negative amount, 15%)
```

## Step 3: Frontend Changes

The frontend changes are already applied to:
- `app/settings/page.tsx` - Delete account functionality
- `pages/client/ClientTasks.tsx` - Payment breakdown in review

No additional frontend deployment needed if files are already updated.

## Verification

### Platform Fee Display:
1. Create a task with $10 payout
2. Review dialog should show:
   - Worker Payment: $10.00
   - Platform Fee (15%): $1.50
   - Education Fund (15%): $1.50
   - Total Cost: $13.00

### Delete Account:
1. Go to Settings
2. Click "Delete Account"
3. Modal appears with warning
4. Confirm deletion
5. Account and all data deleted

## Rollback (if needed)

If you need to rollback the changes:

```sql
-- Restore old process_task_payment (without transaction recording)
-- Copy the old version from fix-task-approval.sql backup

-- Remove delete_user_account function
DROP FUNCTION IF EXISTS delete_user_account(UUID);
```

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify all tables exist (transactions, profiles, etc.)
3. Check RLS policies allow function execution
4. Ensure authenticated users have proper permissions
