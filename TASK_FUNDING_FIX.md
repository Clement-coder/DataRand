# Task Funding Fix - Embedded Wallet Transaction Signing

## Problem
When funding a task, the transaction was not being signed by the user's embedded wallet. The backend was attempting to fund tasks using the server wallet, which caused:
- No wallet signature prompt for users
- Funds not being deducted from user wallets
- Tasks not appearing as funded
- Smart contract rejecting transactions (only creator can fund)

## Root Cause
The smart contract's `fundTask()` function requires the **task creator** to send ETH directly:
```solidity
function fundTask(uint256 _taskId) external payable {
    if (msg.sender != task.creator && msg.sender != owner()) 
        revert("Only creator or owner can fund");
    // ...
}
```

The backend was trying to call this function from the server wallet instead of having the user sign it with their embedded wallet.

## Solution

### Backend Changes

1. **Modified `escrowService.fundTaskOnChain()`** (`back-end/src/services/escrowService.js`)
   - Changed from executing the transaction to **preparing transaction data**
   - Returns unsigned transaction data for the frontend to sign
   - Added `verifyTaskFunding()` to check on-chain status

2. **Split `taskService.fundTask()` into two functions** (`back-end/src/services/taskService.js`)
   - `fundTask()`: Prepares transaction data and returns it to frontend
   - `confirmTaskFunding()`: Verifies on-chain funding and updates database

3. **Added new controller endpoint** (`back-end/src/controllers/taskController.js`)
   - `POST /tasks/:id/fund` - Returns transaction data
   - `POST /tasks/:id/confirm-funding` - Confirms funding after user signs

4. **Database Migration** (`sql/10_add_funding_tx_hash.sql`)
   - Added `funding_tx_hash` column to track transaction hashes

### Frontend Changes

1. **Updated API client** (`lib/datarand.ts`)
   - Added `confirmTaskFunding()` method

2. **Modified `handleFundTask()`** (`components/pages/client/CreateTask.tsx`)
   - Step 1: Get transaction data from backend
   - Step 2: Get user's embedded wallet from Privy
   - Step 3: Prompt user to sign transaction
   - Step 4: Wait for transaction confirmation
   - Step 5: Confirm funding with backend

## Flow Diagram

```
User clicks "Fund Task"
    ↓
Frontend calls: POST /tasks/:id/fund
    ↓
Backend prepares transaction data
    ↓
Frontend receives: { txData: { to, data, value, from } }
    ↓
Frontend prompts user to sign with embedded wallet
    ↓
User signs transaction → ETH deducted from wallet
    ↓
Frontend waits for transaction confirmation
    ↓
Frontend calls: POST /tasks/:id/confirm-funding { txHash }
    ↓
Backend verifies on-chain status
    ↓
Backend updates task status to FUNDED
    ↓
Task appears on tasks page
```

## Testing

To test the fix:

1. Create a task with valid details
2. Click "Fund with ETH" button
3. You should see a wallet signature prompt
4. Sign the transaction
5. Wait for confirmation (toast notification)
6. Task should appear as FUNDED in your tasks list
7. Check your wallet balance - ETH should be deducted

## Files Modified

- `back-end/src/services/escrowService.js`
- `back-end/src/services/taskService.js`
- `back-end/src/controllers/taskController.js`
- `back-end/src/routes/taskRoutes.js`
- `dataRand_front-end/lib/datarand.ts`
- `dataRand_front-end/components/pages/client/CreateTask.tsx`
- `sql/10_add_funding_tx_hash.sql` (new)

## Notes

- The fix ensures proper Web3 wallet integration
- Users now have full control over their transactions
- Transaction hashes are stored for audit trails
- The solution is compatible with Privy's embedded wallet system
- Error handling includes user-friendly messages for rejected transactions
