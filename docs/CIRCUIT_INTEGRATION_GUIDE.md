# Circuit Integration Guide

## Overview

This guide explains how Noir circuits are integrated into the Next.js frontend for zero-knowledge proof generation.

## Architecture

```
circuits/                       # Noir circuit source code
├── account_system/            # Main transfer circuit
├── commitment_system/         # UTXO-style circuit
└── pedersen_hash_multi/      # Hash helper circuit

frontend/
├── src/circuits/             # Compiled circuit JSON files
│   ├── account_system.json
│   ├── commitment_system.json
│   └── pedersen_hash_multi.json
├── src/lib/
│   ├── circuits.ts          # Main circuit module (types & utilities)
│   └── circuits-client.ts   # Client-only functions for React
└── src/app/
    ├── account-system/      # Uses circuits-client.ts
    └── commitment-system/   # Uses circuits-client.ts
```

## How Zero-Knowledge Proofs Work Here

### 1. **Circuit Compilation**
```bash
cd circuits/account_system
nargo compile
# Creates target/account_system.json
```

### 2. **Frontend Integration**
```typescript
// circuits-client.ts - Simple factory function
const prover = await createAccountSystemProver();

// circuits.ts - Full class with state
const prover = new AccountSystemProver();
await prover.initialize();
```

### 3. **Input Generation Flow**

```mermaid
graph LR
    A[User Input] --> B[Pedersen Hasher]
    B --> C[Hash Calculations]
    C --> D[Circuit Inputs]
    D --> E[Witness Generation]
    E --> F[Proof Generation]
    F --> G[ZK Proof]
```

### 4. **The Constraint Problem**

The main issue causing "Cannot satisfy constraint" errors:

```noir
// Circuit expects:
let computed_pubkey = pedersen_hash([sender_secret_key]);
assert(sender_account.pubkey == computed_pubkey);
```

The circuit uses Noir's built-in Pedersen hash, so frontend inputs MUST use the same hash function. That's why we have `pedersen_hash_multi.json`.

## File Purposes

### `circuits.ts`
- **Purpose**: Complete circuit management system
- **Contains**: TypeScript interfaces, circuit classes, utility functions
- **Use when**: Building new features, need full control

### `circuits-client.ts`
- **Purpose**: Simplified client-only functions
- **Contains**: Factory functions that return simple objects
- **Use when**: In React components/pages

### Why Both Files?

1. **Separation of Concerns**: 
   - `circuits.ts` = Library code
   - `circuits-client.ts` = React integration

2. **SSR Compatibility**:
   - `circuits-client.ts` has `'use client'` directive
   - Prevents "window is not defined" errors

3. **Developer Experience**:
   - Pages use simple functions from `circuits-client.ts`
   - Import types from `circuits.ts`

## Common Patterns

### In Pages (Recommended)
```typescript
import { createAccountSystemProver } from '@/lib/circuits-client';
import type { AccountSystemInputs } from '@/lib/circuits';

const prover = await createAccountSystemProver();
const proof = await prover.generateProof(inputs);
```

### Direct Circuit Usage (Advanced)
```typescript
import { AccountSystemProver, CircuitUtils } from '@/lib/circuits';

const prover = new AccountSystemProver();
await prover.initialize();
```

## Troubleshooting

### "Cannot satisfy constraint"
- Check that all hashes use `PedersenHasher` from `circuits-client.ts`
- Verify input values match circuit expectations
- Use console.log to debug input generation

### "Window is not defined"
- Use `circuits-client.ts` instead of `circuits.ts` in components
- Add `'use client'` directive to components using circuits

### Circuit Changes Not Reflected
1. Recompile circuit: `nargo compile`
2. Copy JSON: `cp target/*.json ../../frontend/src/circuits/`
3. Restart dev server: `bun run dev`

## Current Status

✅ **Working**:
- Circuit compilation and integration
- Pedersen hash computation via helper circuit
- Frontend proof generation flow
- TypeScript interfaces match circuit ABI

⚠️ **Known Issues**:
- "Cannot satisfy constraint" may still occur if hash values don't match
- Some SSR warnings from ink-kit components

## Next Steps

To fix remaining constraint issues:
1. Verify `pedersen_hash_multi` produces same hashes as main circuit
2. Add debug logging to compare computed vs expected values
3. Consider using deterministic test values for demo