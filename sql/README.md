# DataRand SQL Modules

Run files in this order in Supabase SQL Editor:

1. `00_extensions.sql`
2. `01_identity.sql`
3. `02_tasks.sql`
4. `03_compute.sql`
5. `04_functions.sql`
6. `05_storage.sql`
7. `06_policies.sql`
8. `07_seed.sql`
9. `08_backfill_profiles_from_users.sql`
10. `09_tasks_client_id_compat_trigger.sql`
11. `10_add_funding_tx_hash.sql`
12. `11_compute_devices.sql`
13. `12_fix_test_earnings.sql`
14. `13_task_media_storage_policy.sql` - **REQUIRED** Fixes task images not displaying
15. `14_delete_user_account_function.sql` - **REQUIRED** Fixes account deletion

Notes:
- Scripts are idempotent where possible.
- If you hit a function signature conflict, run the matching drop block in `04_functions.sql` first.
- Files marked **REQUIRED** must be run for critical features to work.
