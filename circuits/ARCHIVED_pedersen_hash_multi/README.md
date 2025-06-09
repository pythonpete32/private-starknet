# Pedersen Hash Multi Circuit

## Purpose

This circuit provides a flexible Pedersen hash function that can hash 1-4 Field elements, matching exactly what the main account_system circuit uses internally.

## Why This Exists

The main account_system circuit uses Noir's `std::hash::pedersen_hash` function in three places:

1. **Public key derivation**: `pedersen_hash([secret_key])` - 1 input
2. **Account commitment**: `pedersen_hash([pubkey, balance, nonce, asset_id])` - 4 inputs  
3. **Nullifier generation**: `pedersen_hash([account_commitment, secret_key])` - 2 inputs

To generate valid inputs for the account_system circuit from the frontend, we need to compute these exact same hashes. This helper circuit exposes the same `pedersen_hash` function that the main circuit uses internally.

## How It Works

```noir
fn main(
    inputs: [Field; 4],      // Up to 4 input values
    input_count: u32         // How many inputs to actually hash (1-4)
) -> pub Field              // Returns the hash
```

The circuit:
- Takes an array of 4 Field elements (unused ones can be 0)
- Takes a count of how many to actually hash
- Returns the Pedersen hash of those inputs

## Usage from Frontend

The frontend uses this via the `PedersenHasher` class in `circuits.ts`:

```typescript
const hasher = await createPedersenHasher();

// Hash single input (for pubkey)
const pubkey = await hasher.hashSingle(secretKey);

// Hash two inputs (for nullifier)
const nullifier = await hasher.hashDouble(commitment, secretKey);

// Hash four inputs (for account commitment)
const commitment = await hasher.hashQuadruple(pubkey, balance, nonce, assetId);
```

## Compilation

```bash
cd circuits/pedersen_hash_multi
nargo compile
```

This generates `target/pedersen_hash_multi.json` which is copied to `frontend/src/circuits/`.

## Why Not Use the Main Circuits Directly?

The account_system circuit requires ALL inputs to be provided correctly (merkle proofs, valid accounts, etc.). We can't just call it to get a hash - it would fail the constraints. This helper circuit ONLY does hashing, making it perfect for input preparation.