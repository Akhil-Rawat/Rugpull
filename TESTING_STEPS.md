# 🛡️ ShieldFi - Complete Testing Guide

## Contract Addresses

```
ShieldFi (Insurance Contract):  0x100cd75e83E38549bE3acCB2806909Db60Cc5700
MockToken (Test Token):         0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
```

---

## 📋 Overview

This guide shows you how to test the ShieldFi insurance contract step-by-step in Remix.

**What you'll do:**

1. ✅ Register a token
2. ✅ Buy insurance coverage
3. ✅ Simulate a rug pull
4. ✅ Claim your payout

**What you'll get:**

- Bought 2 MON coverage for 0.2 MON premium
- Rug pull detected (95% liquidity drop)
- Received 0.1 MON payout (proportional to 95% drop)

---

## 🔗 Setup (Before Testing)

### Open Remix

1. Go to https://remix.ethereum.org
2. Connect MetaMask to **Monad Testnet**
   - Chain ID: 10143
   - RPC: https://testnet-rpc.monad.xyz

### Add ShieldFi Contract to Remix

1. Click "At Address" in Deploy section
2. Paste: `0x100cd75e83E38549bE3acCB2806909Db60Cc5700`
3. Select "ShieldFi" from dropdown
4. Click "At Address" button

✅ Contract interface loads in Remix!

---

## 📝 STEP 1: Register Token

**Function:** `registerToken`  
**Time:** ~5 seconds

### What This Does

Tells ShieldFi contract: "Hey, monitor this token. Its initial liquidity is 100 MON."

### Fill These Fields

#### Field 1: Address

```
Label: address (first parameter)
Value: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
```

**What is this?** The MockToken address (the token we want to insure)

#### Field 2: InitialLiquidity

```
Label: initialLiquidity (second parameter)
Value: 100000000000000000000
```

**What is this?** 100 MON in Wei format (18 decimals)

**Why 100?** So when liquidity drops to 5, it's a 95% drop

#### Field 3: Value

```
Current: 0 wei
Change to: KEEP AS 0
```

**Why 0?** Registering a token costs nothing (non-payable function)

#### Field 4: Gas Limit

```
Current: auto
Change to: KEEP AS AUTO
```

---

### Execute Step 1

```
✓ Fill address: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
✓ Fill initialLiquidity: 100000000000000000000
✓ Keep Value: 0
✓ Click TRANSACT button
✓ Wallet pops up → Confirm transaction
✓ Wait for receipt
```

### Expected Result

```
✅ Transaction successful
✅ Event emitted: TokenRegistered(address, 100 MON)
✅ Token is now being monitored by ShieldFi
```

---

## 💳 STEP 2: Buy Insurance Coverage

**Function:** `buyCoverage`  
**Time:** ~5 seconds

### What This Does

You pay 0.2 MON premium to get 2 MON of insurance coverage.

**Insurance Deal:**

- You insure: 2 MON
- You pay: 0.2 MON (10% premium)
- Valid for: 48 hours
- You get: Policy ID #0

### Fill These Fields

#### Field 1: TokenAddress

```
Label: tokenAddress (first parameter)
Value: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
```

**What is this?** Same MockToken address (we're buying insurance for this token)

#### Field 2: InsuredAmount

```
Label: insuredAmount (second parameter)
Value: 2000000000000000000
```

**What is this?** 2 MON in Wei format (18 decimals)

**Breakdown:**

- 2 = how many MON to insure
- 000000000000000000 = 18 zeros (Wei decimal places)

#### Field 3: Value (IMPORTANT!)

```
Current: 0 wei
Change to: 200000000000000000
```

**What is this?** 0.2 MON in Wei (the premium payment)

**Breakdown:**

- 0.2 = your insurance premium
- 200000000000000000 = 0.2 MON in Wei

**⚠️ THIS IS MONEY!** You're paying 0.2 MON!

#### Field 4: Gas Limit

```
Current: auto
Change to: KEEP AS AUTO
```

---

### Execute Step 2

```
✓ Fill tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
✓ Fill insuredAmount: 2000000000000000000
✓ CHANGE Value: 200000000000000000
✓ Click TRANSACT button
✓ Wallet pops up → CONFIRM (you're sending 0.2 MON)
✓ Wait for receipt
```

### Expected Result

```
✅ Transaction successful
✅ Event emitted: CoveragePurchased(policyId: 0, amount: 2 MON, premium: 0.2 MON)
✅ Policy ID: 0
✅ Status: PROTECTED ✅
✅ Sample balance: -0.2 MON (you paid it)
```

---

## 🔴 STEP 3: Simulate Rug Pull

**Function:** `simulateRugPull`  
**Time:** ~5 seconds

### What This Does

Simulates a token liquidity crash. Goes from 100 MON → 5 MON (95% drop).

**This Triggers:**

- RugDetected = TRUE
- Policy Status: PROTECTED → **CLAIM NOW** 🔴 (RED)
- You become eligible to claim

### Fill These Fields

#### Field 1: TokenAddress

```
Label: tokenAddress (first parameter)
Value: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
```

**What is this?** Same MockToken (which token got rugged?)

#### Field 2: Value

```
Current: 0 wei
Change to: KEEP AS 0
```

**Why 0?** Simulating a rug costs nothing (non-payable function)

#### Field 3: Gas Limit

```
Current: auto
Change to: KEEP AS AUTO
```

---

### Execute Step 3

```
✓ Fill tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
✓ Keep Value: 0
✓ Click TRANSACT button
✓ Wallet pops up → Confirm
✓ Wait for receipt
```

### Expected Result

```
✅ Transaction successful
✅ Events emitted:
   - LiquidityUpdated(token, 5 MON, 9500 bps)
   - RugSimulated(token)
   - RugDetected(token, 5 MON, 9500 bps)
✅ Contract state: rugDetected = TRUE
✅ Policy Status: CLAIM NOW 🔴
✅ You can now claim!
```

---

## 💰 STEP 4: Claim Payout

**Function:** `claimPayout`  
**Time:** ~5 seconds

### What This Does

Claims your insurance payout (0.1 MON).

**Payout Calculation:**

```
Insured Amount: 2 MON
Drop: 95% (9500 basis points)
Recovery: 5% (10000 - 9500 = 500)

Payout = 2 × 500 / 10000 = 0.1 MON
```

### Fill These Fields

#### Field 1: PolicyId

```
Label: policyId (parameter)
Value: 0
```

**What is this?** The policy you bought in Step 2 (Policy ID #0)

**Why 0?** This was your first and only policy

#### Field 2: Value

```
Current: 0 wei
Change to: KEEP AS 0
```

**Why 0?** Claiming costs nothing (you're getting paid, not paying)

#### Field 3: Gas Limit

```
Current: auto
Change to: KEEP AS AUTO
```

---

### Execute Step 4

```
✓ Fill policyId: 0
✓ Keep Value: 0
✓ Click TRANSACT button
✓ Wallet pops up → Confirm
✓ Wait for receipt
```

### Expected Result

```
✅ Transaction successful
✅ Event emitted: PayoutClaimed(policyId: 0, amount: 0.1 MON)
✅ You receive: 0.1 MON in wallet
✅ Policy marked as: CLAIMED ✅
✅ Status: PAID OUT
```

---

## 📊 Verify Results

### Check Policy Status

Use **READ** function: `getPolicy`

```
Input: 0 (policy ID)

Output:
{
  holder: [your wallet address],
  tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec,
  insuredAmount: 2000000000000000000,
  premium: 200000000000000000,
  startTime: [unix timestamp],
  expiryTime: [48 hours later],
  active: false,           ← NOW FALSE (was true before claim)
  claimed: true            ← NOW TRUE (was false before claim)
}
```

### Check Token Risk

Use **READ** function: `getTokenRisk`

```
Input: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec

Output:
{
  tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec,
  initialLiquidity: 100000000000000000000,
  lastCheckedLiquidity: 5000000000000000000,    ← Dropped to 5
  lastCheckedTime: [unix timestamp],
  lastDropBps: 9500,                           ← 95% DROP
  rugDetected: true                            ← RUG DETECTED!
}
```

### Check Premium Pool

Use **READ** function: `totalPremiumPool`

```
Expected output: 180000000000000000
(200000000000000000 - 200000000000000000 + 180000000000000000)

Wait, that's wrong. Let me recalculate:
- You paid: 0.2 MON (200000000000000000)
- Protocol fee: 0.01 MON (10000000000000000) — 5% of 0.2
- Pool received: 0.19 MON (190000000000000000)
- Pool after payout: 190000000000000000 - 100000000000000000 = 90000000000000000
```

---

## 🎯 Summary

| Step | Function        | You Do                         | Contract Responds          |
| ---- | --------------- | ------------------------------ | -------------------------- |
| 1    | registerToken   | Tell contract about token      | Token registered ✅        |
| 2    | buyCoverage     | Pay 0.2 MON for 2 MON coverage | Policy ID 0 created ✅     |
| 3    | simulateRugPull | Trigger 95% liquidity drop     | Rug detected, CLAIM NOW 🔴 |
| 4    | claimPayout     | Claim your 0.1 MON payout      | 0.1 MON received ✅        |

---

## 💡 What Happened?

```
Timeline:
T=0:   You buy 2 MON coverage → Pay 0.2 MON premium
T=X:   Token gets rugged → 95% liquidity loss
T=X+1: Contract auto-detects rug → Marks as CLAIM NOW
T=X+2: You claim → Get 0.1 MON (5% recovery of 2 MON)

Net Result:
- Paid: 0.2 MON
- Received: 0.1 MON
- Loss: 0.1 MON (better than losing 2 MON!)
```

---

## ✅ All Values Quick Reference

```
MOCKTOKEN: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec

Step 1 - registerToken:
  - tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
  - initialLiquidity: 100000000000000000000
  - value: 0

Step 2 - buyCoverage:
  - tokenAddress: 0x993f0B3acBeBd6895BC1Be2968f107cF873386ec
  - insuredAmount: 2000000000000000000
  - value: 200000000000000000  ← IMPORTANT!

Step 3 - simulateRugPull:
  - tokenAddress: 0x833697DbA8753423e01F5766b05A9aF69b906749
  - value: 0

Step 4 - claimPayout:
  - policyId: 0
  - value: 0
```

---

## 🚨 Troubleshooting

### "Token already registered"

**Problem:** You ran Step 1 twice  
**Solution:** Use a different token address or clear state

### "Rug not detected for this token"

**Problem:** You skipped Step 3  
**Solution:** Run `simulateRugPull` before `claimPayout`

### "Insufficient MON sent for premium"

**Problem:** Value field in Step 2 is wrong  
**Solution:** Double-check value is exactly `200000000000000000`

### "Policy not active or already claimed"

**Problem:** You claimed twice with same Policy ID  
**Solution:** Buy another policy (will get Policy ID 1)

### Transaction fails with "Out of gas"

**Problem:** Gas limit too low  
**Solution:** Increase gas limit or use "auto"

---

## 🎓 Learning Points

**Key Concepts:**

1. **Premium Calculation:** insuredAmount × 10% = premium
2. **Proportional Payouts:** payout = insured × (1 - drop%)
3. **Drop Percentage:** (oldLiquidity - newLiquidity) / oldLiquidity × 100
4. **Pool Sustainability:** 10% premiums > variable proportional payouts

**For This Test:**

- Premium: 2 MON × 10% = 0.2 MON ✅
- Drop: (100 - 5) / 100 = 95% ✅
- Payout: 2 MON × (100% - 95%) = 0.1 MON ✅

---

**Ready? Go test on Remix! 🚀**
