# Task Funding and Payment Release Fixes

## Issues Fixed

### 1. Fund Task Error - "No wallet address found"
**Problem:** Backend was failing to find wallet address when funding tasks.

**Root Cause:** The `getWalletAddressForProfile` function only checked `wallet_address` field but not `embedded_wallet_address`.

**Fix:** Updated `/back-end/src/services/taskService.js` in the `fundTask` function to:
- First try the existing `getWalletAddressForProfile` function
- If no address found, query the users table directly for both `embedded_wallet_address` and `wallet_address`
- Use embedded wallet address as priority fallback
- Provide clearer error message

**Location:** `/back-end/src/services/taskService.js` lines 354-373

---

### 2. Payment Not Releasing to Workers
**Problem:** When tasks are approved, payments weren't being released to workers.

**Root Cause:** 
- Worker wallet address lookup only checked `wallet_address`, not `embedded_wallet_address`
- Platform fee is only sent when `completeTask()` is called on the smart contract
- The smart contract's `completeTask()` function requires ALL workers to be paid first before it sends the platform fee

**Fix:** Updated `/back-end/src/services/submissionService.js` in the `approveSubmission` function to:
- Query both `wallet_address` and `embedded_wallet_address` for workers
- Prefer `embedded_wallet_address` over `wallet_address`
- Add validation to ensure worker has a wallet address before attempting payment
- Added clarifying comment that platform fee is sent when task completes

**How Platform Fee Works:**
1. Client funds task with: `(payout × workers) + 15% platform fee`
2. As submissions are approved, workers get paid their individual payouts
3. When ALL workers are paid, `completeTask()` is called
4. `completeTask()` sends the 15% platform fee to the platform wallet
5. Task status changes to COMPLETED

**Location:** `/back-end/src/services/submissionService.js` lines 74-136

---

### 3. USDC Display Showing Long Numbers
**Problem:** USDC balances were showing very long decimal numbers instead of proper formatting.

**Root Cause:** 
- Shaka frontend didn't have a proper wallet balance hook
- USDC has 6 decimals (not 18 like ETH), so raw values need proper formatting

**Fix:** 
- Created `/shaka/src/hooks/useWalletBalance.ts` with proper USDC formatting
- USDC formatted to 2 decimal places using `formatUnits(balance, 6)`
- ETH formatted to 4 decimal places using `formatUnits(balance, 18)`
- Updated CreateTask components to use the hook

**Locations:**
- `/shaka/src/hooks/useWalletBalance.ts` (new file)
- `/shaka/src/pages/client/CreateTask.tsx` (updated to use hook)
- `/dataRand_front-end/components/pages/client/CreateTask.tsx` (updated to use existing hook)

---

### 4. Missing USDC and ETH Logos
**Problem:** Balance displays didn't show token logos, making it unclear which balance was which.

**Fix:** Added token logos from cryptologos.cc to all balance displays:
- USDC logo: `https://cryptologos.cc/logos/usd-coin-usdc-logo.png`
- ETH logo: `https://cryptologos.cc/logos/ethereum-eth-logo.png`

**Locations:**
- `/shaka/src/pages/client/CreateTask.tsx` - Wallet balance display
- `/dataRand_front-end/components/pages/client/CreateTask.tsx` - Wallet balance display
- `/dataRand_front-end/components/pages/Earnings.tsx` - Already had logos

---

## Platform Fee Flow (Clarification)

The platform fee is **automatically sent to the platform wallet** when a task completes. Here's the complete flow:

1. **Task Creation:** Client creates task with payout per worker
2. **Task Funding:** Client funds with `(payout × workers) + 15% platform fee`
   - All funds locked in smart contract escrow
3. **Worker Assignment:** Workers are assigned to the task
4. **Work Submission:** Workers submit their work
5. **Approval & Payment:** Client approves submissions
   - Each approval triggers `releaseBatchPayouts()` 
   - Worker receives their payout immediately
6. **Task Completion:** When ALL workers are paid
   - Backend calls `completeTaskOnChain()`
   - Smart contract's `completeTask()` function executes
   - **Platform fee automatically sent to platform wallet**
   - Task status changes to COMPLETED

**Smart Contract Code Reference:**
```solidity
function completeTask(uint256 _taskId) external onlyOwner nonReentrant {
    // ... validation ...
    task.status = Status.Completed;
    uint256 fee = task.platformFee;
    (bool success, ) = platformWallet.call{value: fee}("");
    if (!success) revert("Platform fee transfer failed");
    emit PlatformFeePaid(_taskId, fee);
}
```

The platform fee is **guaranteed** to be sent because:
- It's locked in the contract during funding
- The contract enforces that all workers must be paid before completion
- The completion transaction automatically transfers the fee
- The transaction reverts if the fee transfer fails

---

## Testing Checklist

### Fund Task
- [ ] Create a task as a client
- [ ] Verify wallet address is detected (embedded or external)
- [ ] Verify balance shows correctly with logos
- [ ] Fund the task successfully
- [ ] Verify task status changes to FUNDED/AVAILABLE

### Worker Payment
- [ ] Worker submits work
- [ ] Client approves submission
- [ ] Verify worker receives payment immediately
- [ ] Check worker's wallet balance increased

### Platform Fee
- [ ] Complete all submissions for a task
- [ ] Verify platform wallet receives 15% fee
- [ ] Check task status changes to COMPLETED
- [ ] Verify transaction on block explorer

### Balance Display
- [ ] USDC shows 2 decimal places (e.g., "10.50 USDC")
- [ ] ETH shows 4 decimal places (e.g., "0.0123 ETH")
- [ ] Both have logos displayed
- [ ] Balances update after transactions

---

## Files Modified

1. `/back-end/src/services/taskService.js` - Wallet address lookup fix
2. `/back-end/src/services/submissionService.js` - Worker payment fix
3. `/shaka/src/hooks/useWalletBalance.ts` - New balance hook (created)
4. `/shaka/src/pages/client/CreateTask.tsx` - Use balance hook + logos
5. `/dataRand_front-end/components/pages/client/CreateTask.tsx` - Use balance hook + logos

---

## Notes

- All calculations are done correctly with 15% platform fee
- Platform fee is sent to the platform wallet address configured in the smart contract
- The platform wallet address can be updated by the contract owner using `setPlatformWallet()`
- USDC uses 6 decimals, ETH uses 18 decimals - both are now formatted correctly
- Embedded wallets are prioritized over external wallets for consistency
