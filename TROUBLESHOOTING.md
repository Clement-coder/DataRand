# Troubleshooting Guide - Task Funding

## Issue: No wallet signature prompt appears

**Possible causes:**
1. Embedded wallet not created
2. Wallet not connected to Privy
3. JavaScript error in console

**Solutions:**
```bash
# Check browser console for errors
# Look for: "Embedded wallet not found" or similar

# Verify wallet exists:
# 1. Go to Profile/Settings
# 2. Check if wallet address is shown
# 3. If not, create embedded wallet through Privy
```

## Issue: "Insufficient balance" error

**Possible causes:**
1. Not enough ETH in wallet
2. Incorrect total cost calculation

**Solutions:**
```bash
# Check wallet balance
# Make sure you have: (payout × workers) + 15% platform fee

# Example:
# Payout: 0.01 ETH
# Workers: 5
# Total needed: (0.01 × 5) + 15% = 0.0575 ETH
```

## Issue: Transaction rejected/failed

**Possible causes:**
1. User rejected signature
2. Network issues
3. Gas price too low
4. Wrong network

**Solutions:**
```bash
# 1. Check you're on Arbitrum Sepolia testnet
# 2. Try again and approve the transaction
# 3. Check network status
# 4. Verify contract address in .env
```

## Issue: Transaction confirmed but task not funded

**Possible causes:**
1. Backend not receiving confirmation
2. Database update failed
3. On-chain verification failed

**Solutions:**
```bash
# Check backend logs:
cd back-end
npm start

# Look for:
# "Task X successfully funded and confirmed"
# or error messages

# Check database:
# SELECT * FROM tasks WHERE id = 'your-task-id';
# Status should be 'FUNDED'
# funding_tx_hash should be set
```

## Issue: "Task not found" error

**Possible causes:**
1. Task ID mismatch
2. Task deleted
3. Database connection issue

**Solutions:**
```bash
# Check task exists in database
# Verify task ID in URL matches database

# Check backend logs for SQL errors
```

## Issue: Backend errors

**Common errors and fixes:**

### "Requesting user profile not found"
```bash
# Your user profile is not set up
# Solution: Check auth flow, ensure profile is created on signup
```

### "No wallet address found"
```bash
# Wallet not linked to user account
# Solution: Create embedded wallet in profile settings
```

### "Task cannot be funded. Status is: FUNDED"
```bash
# Task already funded
# Solution: Check task status, may need to create new task
```

### "Blockchain transaction failed"
```bash
# Smart contract interaction failed
# Solution: 
# 1. Check contract address in .env
# 2. Verify network configuration
# 3. Check RPC endpoint is working
```

## Debugging Steps

### 1. Check Frontend Console
```javascript
// Open browser DevTools (F12)
// Look for errors in Console tab
// Check Network tab for failed API calls
```

### 2. Check Backend Logs
```bash
cd back-end
npm start

# Watch for:
# - "fundTask called with taskId: X"
# - "Transaction data prepared"
# - "Task X successfully funded"
```

### 3. Check Database
```sql
-- Check task status
SELECT id, title, status, funding_tx_hash, client_id 
FROM tasks 
WHERE id = 'your-task-id';

-- Check user wallet
SELECT id, wallet_address 
FROM users 
WHERE id = 'your-user-id';

-- Check profile
SELECT id, auth_id 
FROM profiles 
WHERE id = 'your-profile-id';
```

### 4. Check Smart Contract
```bash
# Verify task exists on-chain
# Use block explorer: https://sepolia.arbiscan.io
# Search for contract: 0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34
# Check recent transactions
```

## Still stuck?

1. **Check all environment variables:**
   - Backend: `back-end/.env`
   - Frontend: `dataRand_front-end/.env.local`

2. **Verify Privy configuration:**
   - App ID correct?
   - Embedded wallets enabled?
   - Network configured?

3. **Test with minimal example:**
   - Create task with 1 worker
   - Use small payout (0.001 ETH)
   - Check each step in console

4. **Review logs in order:**
   - Browser console
   - Backend terminal
   - Database queries
   - Block explorer

## Quick Test Checklist

- [ ] Embedded wallet created
- [ ] Wallet has sufficient ETH
- [ ] On correct network (Arbitrum Sepolia)
- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] Database migration applied
- [ ] Task created successfully (status: DRAFT)
- [ ] Wallet signature prompt appears
- [ ] Transaction signed and sent
- [ ] Transaction confirmed on-chain
- [ ] Task status updated to FUNDED
- [ ] Task appears in tasks list

## Environment Variables to Check

### Backend (.env)
```bash
BLOCKCHAIN_ESCROW_CONTRACT_ADDRESS=0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34
BLOCKCHAIN_JSON_RPC_PROVIDER=https://arb-sep.g.alchemy.com/v2/YOUR_KEY
BLOCKCHAIN_DEPLOYER_PRIVATE_KEY=your_private_key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0xF3f0AbF7B633155fd299d0fDdF7977AeE5B7cF34
NEXT_PUBLIC_CHAIN_ID=421614
```
