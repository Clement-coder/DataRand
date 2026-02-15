# Task Visibility Fix

## Problem
Tasks appear in "My Tasks" page (`/client/tasks`) but not in the main Tasks page (`/tasks`) where workers can see available tasks.

## Root Cause
After funding, tasks were being set to status `"FUNDED"`, but the main Tasks page only shows tasks with status `"available"`.

```javascript
// Tasks.tsx - Only shows "available" tasks
.eq("status", "available")
```

## Solution
Changed the task status after funding from `"FUNDED"` to `"available"` so workers can see and claim the tasks.

### Backend Change
**File:** `back-end/src/services/taskService.js`

```javascript
// Before
status: 'FUNDED'

// After  
status: 'available'  // Make task available to workers
```

### Frontend Change
**File:** `dataRand_front-end/components/pages/client/ClientTasks.tsx`

Added `"completed"` to the completed tasks filter so all finished tasks show up properly.

## Task Status Flow

```
DRAFT → (user funds) → available → (worker claims) → assigned → 
in_progress → submitted → (client reviews) → approved/rejected → completed
```

## Testing

1. **Create and fund a task**
   - Go to `/client/create`
   - Fill in details and fund the task
   - Task should appear in "My Tasks" (Active tab)

2. **Check worker view**
   - Go to `/tasks` (main tasks page)
   - Your funded task should now appear here ✅
   - Workers can now see and claim it ✅

3. **Verify in both places**
   - Client view: `/client/tasks` - Shows in Active tab
   - Worker view: `/tasks` - Shows in available tasks list

## Files Modified
- `back-end/src/services/taskService.js`
- `dataRand_front-end/components/pages/client/ClientTasks.tsx`

## Status Definitions

- `DRAFT` - Task created but not funded yet
- `available` - Task funded and ready for workers to claim
- `assigned` - Worker has claimed the task
- `in_progress` - Worker is actively working on it
- `submitted` - Worker submitted their work
- `approved` - Client approved the work
- `rejected` - Client rejected the work
- `completed` - Task fully completed and paid
