# Private Transfer Circuit Integration Guide

## Overview

This guide explains how to integrate the new unified `private_transfer` circuit into the frontend application. This circuit replaces the old two-circuit architecture (`pedersen_hash_multi` + `account_system`) with a single, more secure circuit.

## Circuit Architecture

```
circuits/
├── private_transfer/              # NEW: Unified circuit (USE THIS)
│   ├── src/main.nr               # Single circuit with all functionality
│   └── target/private_transfer.json
├── ARCHIVED_account_system/       # OLD: Main circuit (archived)
├── ARCHIVED_pedersen_hash_multi/  # OLD: Helper circuit (archived)
└── commitment_system/             # Different use case (unused)

frontend/src/circuits/
├── private_transfer.json          # NEW: Single circuit to import
├── account_system.json           # OLD: Remove after migration
└── pedersen_hash_multi.json      # OLD: Remove after migration
```

## Key Changes from Old System

### **Security Improvements**
- **All hash computation inside circuit** (no exposed intermediate values)
- **Raw inputs only** (no pre-computed structs)
- **Industry standard single-circuit architecture**

### **Simplified Parameters**
- **13 parameters** instead of 15 (removed 2 Account struct parameters)
- **Raw field values only** (easier to generate from frontend)
- **No need for PedersenHasher helper circuit**

## New Circuit Interface

### **Input Parameters**

```typescript
interface PrivateTransferInputs {
  // ===== PUBLIC INPUTS =====
  merkle_root: string;
  sender_nullifier: string;
  sender_new_commitment: string;
  recipient_new_commitment: string;
  asset_id: string;
  
  // ===== PRIVATE INPUTS - RAW ONLY =====
  sender_secret_key: string;        // Raw secret key (circuit derives pubkey)
  sender_balance: string;           // Raw balance value
  sender_nonce: string;             // Raw nonce value
  transfer_amount: string;
  recipient_pubkey: string;
  recipient_old_balance: string;
  recipient_old_nonce: string;
  sender_merkle_path: string[];     // Array of 20 elements
  sender_merkle_indices: string[];  // Array of 20 elements
}
```

### **Public Outputs**
The circuit returns the same public outputs as before:
- `merkle_root`: Global state root
- `sender_nullifier`: Prevents double-spending
- `sender_new_commitment`: Alice's new account state
- `recipient_new_commitment`: Bob's new account state
- `asset_id`: Token type

## Frontend Integration

### **Updated circuits-client.ts**

```typescript
'use client';

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

// NEW: Single unified prover (replaces both PedersenHasher and AccountSystemProver)
export const createPrivateTransferProver = async () => {
  const circuit = await import('../circuits/private_transfer.json');
  const circuitData = circuit.default || circuit;
  
  const noir = new Noir(circuitData as any);
  const backend = new UltraHonkBackend(circuitData.bytecode);

  return {
    async generateProof(inputs: PrivateTransferInputs) {
      const { witness } = await noir.execute(inputs);
      const proof = await backend.generateProof(witness);
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    },

    async verifyProof(proof: any) {
      return await backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicInputs
      });
    }
  };
};

// DEPRECATED: Remove after migration
// export const createPedersenHasher = async () => { ... }
// export const createAccountSystemProver = async () => { ... }
```

### **Updated Input Generation**

```typescript
// OLD: Two-step process with helper circuit
const hasher = await createPedersenHasher();
const pubkey = await hasher.hashSingle(secretKey);              // EXPOSED!
const commitment = await hasher.hashQuadruple(pubkey, balance, nonce, assetId); // EXPOSED!

const accountProver = await createAccountSystemProver();
const proof = await accountProver.generateProof({
  sender_account: { pubkey, balance, nonce, asset_id },        // Pre-computed struct
  sender_new_account: { pubkey, newBalance, newNonce, asset_id }, // Pre-computed struct
  // ... other inputs
});

// NEW: Single-step process with raw inputs only
const prover = await createPrivateTransferProver();
const proof = await prover.generateProof({
  // All raw inputs (circuit computes hashes internally)
  sender_secret_key: account.secretKey,
  sender_balance: account.balance,
  sender_nonce: account.nonce,
  transfer_amount: amount,
  recipient_pubkey: recipient.pubkey,
  recipient_old_balance: recipient.balance,
  recipient_old_nonce: recipient.nonce,
  sender_merkle_path: merkleProof.path,
  sender_merkle_indices: merkleProof.indices,
  merkle_root: treeManager.getRoot(),
  sender_nullifier: nullifier,
  sender_new_commitment: newSenderCommitment,
  recipient_new_commitment: newRecipientCommitment,
  asset_id: assetId
});
```

## Migration Steps

### **Step 1: Update Circuit Import**
```typescript
// Replace in circuits-client.ts
const circuit = await import('../circuits/private_transfer.json');
// Remove: import('../circuits/account_system.json')
// Remove: import('../circuits/pedersen_hash_multi.json')
```

### **Step 2: Simplify Account Helpers**

```typescript
// OLD: AccountHelpers used PedersenHasher
export class AccountHelpers {
  static async calculateCommitment(account: PrivateAccount): Promise<string> {
    const hasher = await createPedersenHasher();  // REMOVE THIS
    const pubkey = await hasher.hashSingle(account.secretKey);
    return await hasher.hashQuadruple(pubkey, account.balance, account.nonce, account.asset_id);
  }
}

// NEW: Use deterministic hash function (no circuit needed)
export class AccountHelpers {
  static calculateCommitment(account: PrivateAccount): string {
    // Use deterministic hash for tree indexing (no circuit execution)
    return deterministicHash(account.secretKey, account.balance, account.nonce, account.asset_id);
  }
}
```

### **Step 3: Update Proof Generation UI**

```typescript
// OLD: Complex multi-step progress
setProgressMessage('Computing hashes...');
const hasher = await createPedersenHasher();
// ... hash computation

setProgressMessage('Generating proof...');
const prover = await createAccountSystemProver();
// ... proof generation

// NEW: Simple single-step progress
setProgressMessage('Generating zero-knowledge proof...');
const prover = await createPrivateTransferProver();
const proof = await prover.generateProof(rawInputs);
```

## Input Generation Examples

### **Account Creation**
```typescript
// No longer need to pre-compute pubkey during account creation
const newAccount = {
  secretKey: generateFieldSafeSecretKey(),
  balance: "0",
  nonce: "0",
  asset_id: assetId,
  created: Date.now()
  // pubkey removed - derived inside circuit
};
```

### **Transfer Preparation**
```typescript
async function prepareTransferInputs(
  senderAccount: PrivateAccount,
  recipientPubkey: string,
  transferAmount: string,
  merkleProof: MerkleProof
): Promise<PrivateTransferInputs> {
  // Generate nullifier (for frontend display/validation)
  const senderCommitment = AccountHelpers.calculateCommitment(senderAccount);
  const nullifier = generateNullifier(senderCommitment, senderAccount.secretKey);
  
  // Compute new commitments (for frontend display/validation)
  const newSenderCommitment = AccountHelpers.calculateCommitment({
    ...senderAccount,
    balance: (BigInt(senderAccount.balance) - BigInt(transferAmount)).toString(),
    nonce: (parseInt(senderAccount.nonce) + 1).toString()
  });
  
  // Recipient provides their own new commitment
  const recipientNewCommitment = await getRecipientCommitment(
    recipientPubkey, 
    transferAmount
  );
  
  return {
    // Public inputs
    merkle_root: merkleProof.root,
    sender_nullifier: nullifier,
    sender_new_commitment: newSenderCommitment,
    recipient_new_commitment: recipientNewCommitment,
    asset_id: senderAccount.asset_id,
    
    // Private inputs - all raw values
    sender_secret_key: senderAccount.secretKey,
    sender_balance: senderAccount.balance,
    sender_nonce: senderAccount.nonce,
    transfer_amount: transferAmount,
    recipient_pubkey: recipientPubkey,
    recipient_old_balance: recipientOldBalance,
    recipient_old_nonce: recipientOldNonce,
    sender_merkle_path: merkleProof.path,
    sender_merkle_indices: merkleProof.indices
  };
}
```

## Security Benefits

### **Hash Computation Inside Circuit**
- **Before**: Hashes computed in JavaScript (visible in memory/debugging)
- **After**: All hashes computed inside ZK circuit (truly private)

### **No Pre-Computed Structs**
- **Before**: Account structs built outside circuit (manipulation risk)
- **After**: All computation from raw inputs (tamper-proof)

### **Atomic Proof Generation**
- **Before**: Two separate circuit executions (coordination complexity)
- **After**: Single circuit execution (atomic operation)

## Testing

### **Circuit Tests**
```bash
cd circuits/private_transfer
nargo test  # All 7 tests should pass
```

### **Frontend Integration Tests**
```typescript
describe('Private Transfer Circuit', () => {
  it('should generate proof with raw inputs', async () => {
    const prover = await createPrivateTransferProver();
    const inputs = prepareTransferInputs(/* ... */);
    
    const proof = await prover.generateProof(inputs);
    expect(proof.proof).toBeDefined();
    expect(proof.publicInputs).toHaveLength(5);
  });
  
  it('should verify generated proof', async () => {
    const prover = await createPrivateTransferProver();
    const proof = await prover.generateProof(validInputs);
    
    const isValid = await prover.verifyProof(proof);
    expect(isValid).toBe(true);
  });
});
```

## Troubleshooting

### **"Cannot satisfy constraint" Errors**
- Verify all inputs are proper decimal strings (not hex)
- Ensure secret keys are field-safe (< BN254 modulus)
- Check that balance >= transfer_amount
- Verify Merkle proof path/indices are correct

### **"Module not found" Errors**
- Ensure `private_transfer.json` is copied to `frontend/src/circuits/`
- Update import paths to use new circuit name
- Remove old circuit imports

### **Bundle Size Issues**
- Old system: 2 circuits in bundle
- New system: 1 circuit (smaller bundle)
- Remove old circuit JSON files after migration

## Migration Checklist

- [ ] Copy `private_transfer.json` to frontend
- [ ] Update `circuits-client.ts` with new prover
- [ ] Remove PedersenHasher dependencies from AccountHelpers
- [ ] Update proof generation UI flow
- [ ] Test with real account data
- [ ] Verify all tests pass
- [ ] Remove old circuit files
- [ ] Update documentation

## Next Steps

After completing this migration:
1. **Phase 4.1**: Generate Cairo verifier using Garaga
2. **Phase 4.2**: Implement smart contracts using final circuit interface
3. **Phase 4.3**: Deploy to Starknet testnet

The unified circuit provides a clean, secure foundation for the remaining Phase 4 development.