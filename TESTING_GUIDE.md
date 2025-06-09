# Testing Guide - Account Persistence System

## **What You Should Test**

### **Quick Visual Test (2 minutes)**
1. **Connect Wallet**: Go to http://localhost:3000/account-system
2. **Create Account**: Click "Create New Account"
3. **Check Browser Storage**: 
   - Open DevTools (F12)
   - Go to Application → Local Storage → localhost:3000
   - Look for keys like `privateAccount_[your_wallet]_0`
4. **Refresh Page**: Hit F5
5. **Verify Persistence**: Account should still be there

### **What Should Happen**
```
✅ Account appears immediately after creation
✅ Account has random secret key (not "12345")
✅ Account persists after page refresh
✅ Multiple accounts can be created
✅ Selected account shows in transfer section
```

### **What Would Indicate Failure**
```
❌ No accounts appear after creation
❌ Accounts disappear after refresh
❌ Secret key is still "12345"
❌ Transfer section says "No Account Selected"
❌ Console errors about localStorage
```

## **Architecture Explanation**

### **The Two-Layer System**
```
┌─────────────────────┐     ┌─────────────────────┐
│   Starknet Wallet   │────▶│   ZK Private Account │
│   (Argent/Braavos)  │     │   (Generated Keys)   │
│                     │     │                      │
│ • Your identity     │     │ • Privacy layer      │
│ • Signs transactions│     │ • Hides amounts      │
│ • Pays gas         │     │ • Separate keypair   │
│ • Public on-chain  │     │ • Stored in browser  │
└─────────────────────┘     └─────────────────────┘
```

### **Key Storage Details**
- **Where**: Browser localStorage (not your wallet)
- **Format**: JSON with account data
- **Security**: Keys never leave your browser
- **Persistence**: Survives browser refresh
- **Scope**: Per-wallet (each Starknet wallet has own accounts)

### **Multi-Account Example**
```
Starknet Wallet: 0x123...abc
├── ZK Account 1: secretKey_a1b2c3 (balance: 1000 DAI)
├── ZK Account 2: secretKey_d4e5f6 (balance: 500 DAI)  
└── ZK Account 3: secretKey_g7h8i9 (balance: 0 DAI)
```

## **Testing Browser Storage**

### **Check localStorage**
```javascript
// In browser console:
Object.keys(localStorage).filter(k => k.includes('privateAccount'))
// Should show: ["privateAccount_0x123...abc_0", "privateAccount_0x123...abc_1"]

// View account data:
JSON.parse(localStorage.getItem('privateAccount_0x123...abc_0'))
// Should show: { secretKey: "a1b2c3...", pubkey: "def456...", balance: "0", ... }
```

### **Test Account Creation**
```javascript
// In browser console after connecting wallet:
import { AccountHelpers } from '@/lib/accountHelpers';

// Create test account
const account = await AccountHelpers.createAccount("1");
console.log('New account:', account);
// Should show real 64-character hex secret key
```

## **Debugging Commands**

### **If Accounts Don't Persist**
```javascript
// Check if localStorage is working:
localStorage.setItem('test', 'hello');
localStorage.getItem('test'); // Should return 'hello'

// Clear all accounts (fresh start):
Object.keys(localStorage)
  .filter(k => k.includes('privateAccount'))
  .forEach(k => localStorage.removeItem(k));
```

### **If Secret Keys Are Still "12345"**
- **Problem**: AccountHelpers.createAccount() not using crypto.getRandomValues()
- **Check**: Look for secure key generation in accountHelpers.ts
- **Expected**: 64-character hex string like "a1b2c3d4e5f6..."

## **Production vs Demo**

### **What's Demo (Phase 3)**
- ✅ Real account persistence
- ✅ Real secure key generation  
- ✅ Real proof generation
- ❌ Mock balances (you start with 0)
- ❌ Single-leaf Merkle trees
- ❌ No chain integration

### **What's Coming (Phase 4)**
- ✅ Multi-user Merkle trees
- ✅ Real DAI deposits/withdrawals
- ✅ Chain verification
- ✅ Real money transfers

## **Common Issues**

### **"Module parse failed" Errors**
- **Cause**: Duplicate variable names or import issues
- **Fix**: Check for duplicate `const` declarations

### **"InkPageLayout not found"**
- **Cause**: Import statement issue
- **Fix**: Verify `InkPageLayout` is in import from '@inkonchain/ink-kit'

### **"Cannot read properties of null"**
- **Cause**: Trying to use accounts before wallet connection
- **Fix**: Always check `walletAddress` exists before account operations

## **Success Criteria**
- [ ] Can create account without wallet connection errors
- [ ] Account appears in UI immediately
- [ ] Secret key is 64 random hex characters  
- [ ] Account persists after browser refresh
- [ ] Multiple accounts can be created
- [ ] Selected account shows in transfer interface
- [ ] localStorage contains account data