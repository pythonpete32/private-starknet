# Zero-Knowledge Concepts Explained

## Table of Contents
1. [Commitment Structures](#commitment-structures)
2. [Nullifiers](#nullifiers)
3. [Implementation Guide](#implementation-guide)
4. [Practical Examples](#practical-examples)

---

## Commitment Structures

### What is a Commitment?
A **commitment** is like a sealed envelope in cryptography. You put a secret value inside, seal it, and give the sealed envelope to someone. They can't see what's inside, but you can later prove what value you committed to by revealing the original value and showing it matches the commitment.

### Mathematical Definition
A commitment scheme has two main operations:
- **Commit**: `commitment = hash(value + randomness)`
- **Reveal**: Prove that a commitment contains a specific value

### Why Use Commitments?
1. **Privacy**: Hide the actual value while proving you have one
2. **Integrity**: Prove you haven't changed your mind after committing
3. **Non-repudiation**: Can't deny what you committed to later

### Types of Commitments

#### 1. Hash-Based Commitments (Simplest)
```
commitment = SHA256(value || nonce)
```
- **value**: The secret data you want to commit to
- **nonce**: Random number to prevent brute force attacks
- **||**: Concatenation operator

#### 2. Pedersen Commitments (Most Common in ZK)
```
commitment = g^value * h^randomness
```
- **g, h**: Generator points on an elliptic curve
- **value**: Your secret value
- **randomness**: Random blinding factor
- More efficient for zero-knowledge proofs

#### 3. Merkle Tree Commitments
Used when committing to multiple values:
```
Root = hash(hash(leaf1, leaf2), hash(leaf3, leaf4))
```

### Real-World Analogy
Think of a commitment like:
- **Auction**: You write your bid on paper, put it in a sealed envelope
- **Later**: You open the envelope to reveal your bid
- **Properties**: 
  - Nobody can see your bid beforehand (hiding)
  - You can't change your bid after sealing (binding)

---

## Nullifiers

### What is a Nullifier?
A **nullifier** is a unique "receipt" that proves you've used something without revealing what you used. It prevents double-spending while maintaining privacy.

### The Problem Nullifiers Solve
Without nullifiers:
- Alice has a secret coin worth $10
- She spends it with Bob
- She could spend the same coin again with Charlie (double-spending!)
- How do we prevent this without revealing which coin she spent?

### How Nullifiers Work

#### 1. Generation
When you want to spend a private asset:
```
nullifier = hash(secret_key + asset_id + spending_context)
```

#### 2. Publishing
- You publish the nullifier publicly
- You prove (in zero-knowledge) that you own the asset
- You DON'T reveal which asset or your secret key

#### 3. Verification
- Network checks: "Has this nullifier been used before?"
- If yes: Reject (double-spending attempt)
- If no: Accept and record the nullifier

### Nullifier Properties
1. **Unique**: Each asset generates a unique nullifier
2. **Unlinkable**: Can't tell which asset was spent
3. **Deterministic**: Same asset always generates same nullifier
4. **One-time**: Each nullifier can only be used once

### Real-World Analogy
Think of nullifiers like:
- **Concert Tickets**: You have a ticket with a unique barcode
- **Entry**: Scanner reads barcode, lets you in once
- **Prevention**: Same barcode won't work twice
- **Privacy**: Scanner doesn't need to know your identity, just that ticket is valid

---

## Implementation Guide

### Phase 1: Basic Commitment System

#### Step 1: Choose Your Commitment Scheme
For beginners, start with hash-based:
```python
import hashlib
import secrets

def create_commitment(value, nonce=None):
    if nonce is None:
        nonce = secrets.randbits(256)
    
    data = str(value) + str(nonce)
    commitment = hashlib.sha256(data.encode()).hexdigest()
    
    return commitment, nonce

def verify_commitment(commitment, value, nonce):
    expected_commitment, _ = create_commitment(value, nonce)
    return commitment == expected_commitment
```

#### Step 2: Store Commitments
```python
# Simple storage (use database in production)
commitments = {}

def store_commitment(user_id, commitment):
    commitments[user_id] = commitment
```

### Phase 2: Add Nullifiers

#### Step 1: Generate Nullifiers
```python
def generate_nullifier(secret_key, asset_id, context="spend"):
    data = f"{secret_key}:{asset_id}:{context}"
    nullifier = hashlib.sha256(data.encode()).hexdigest()
    return nullifier
```

#### Step 2: Track Used Nullifiers
```python
used_nullifiers = set()

def is_nullifier_used(nullifier):
    return nullifier in used_nullifiers

def mark_nullifier_used(nullifier):
    if is_nullifier_used(nullifier):
        raise Exception("Double spending detected!")
    used_nullifiers.add(nullifier)
```

### Phase 3: Zero-Knowledge Integration

#### Using Cairo (StarkNet)
```cairo
// Commitment verification
func verify_commitment{pedersen_ptr: HashBuiltin*}(
    commitment: felt, value: felt, nonce: felt
) -> () {
    let (computed_commitment) = hash2{hash_ptr=pedersen_ptr}(value, nonce);
    assert commitment = computed_commitment;
    return ();
}

// Nullifier generation
func generate_nullifier{pedersen_ptr: HashBuiltin*}(
    secret_key: felt, asset_id: felt
) -> (nullifier: felt) {
    let (nullifier) = hash2{hash_ptr=pedersen_ptr}(secret_key, asset_id);
    return (nullifier,);
}
```

---

## Practical Examples

### Example 1: Private Voting System

#### Setup
```python
# Voter commits to their choice
choice = "candidate_A"  # Secret vote
commitment, nonce = create_commitment(choice)

# Store commitment publicly
store_commitment(voter_id="alice", commitment=commitment)
```

#### Voting
```python
# Generate nullifier to prevent double voting
nullifier = generate_nullifier(
    secret_key="alice_secret_key",
    asset_id="voting_right_2024", 
    context="election_2024"
)

# Check if already voted
if is_nullifier_used(nullifier):
    print("Already voted!")
else:
    # Cast vote and mark nullifier as used
    mark_nullifier_used(nullifier)
    print("Vote cast successfully!")
```

### Example 2: Private Transfers

#### Alice sends money to Bob privately
```python
# Alice's setup
alice_balance = 100
alice_secret = "alice_private_key"

# Create commitment to new balances
alice_new_balance = 70  # After sending 30 to Bob
bob_new_balance = 30    # Bob receives 30

alice_commitment, alice_nonce = create_commitment(alice_new_balance)
bob_commitment, bob_nonce = create_commitment(bob_new_balance)

# Generate nullifier for Alice's old balance
alice_nullifier = generate_nullifier(
    secret_key=alice_secret,
    asset_id="balance_commitment_old",
    context="transfer_to_bob"
)

# Verify Alice hasn't spent this balance before
if not is_nullifier_used(alice_nullifier):
    # Process transfer
    mark_nullifier_used(alice_nullifier)
    store_commitment("alice", alice_commitment)
    store_commitment("bob", bob_commitment)
    print("Private transfer completed!")
```

### Example 3: Anonymous Credentials

#### University issues degree credential
```python
# Student's identity (kept secret)
student_id = "student_12345"
degree_info = "Computer Science BS 2024"

# University creates commitment
credential_commitment, credential_nonce = create_commitment(
    f"{student_id}:{degree_info}"
)

# Student can later prove they have degree without revealing identity
def prove_degree(commitment, nonce, required_degree):
    # In real implementation, this would be a zero-knowledge proof
    original_data = f"{student_id}:{degree_info}"
    if verify_commitment(commitment, original_data, nonce):
        if required_degree in degree_info:
            return True
    return False
```

---

## Key Takeaways

### Commitments
- **Purpose**: Hide values while proving you have them
- **Types**: Hash-based (simple), Pedersen (efficient), Merkle (multiple values)
- **Use Cases**: Auctions, voting, private state

### Nullifiers
- **Purpose**: Prevent double-spending while maintaining privacy
- **Components**: Secret key + Asset ID + Context → Unique nullifier
- **Properties**: Unique, unlinkable, deterministic, one-time use

### Implementation Strategy
1. **Start Simple**: Hash-based commitments
2. **Add Privacy**: Nullifiers for double-spending prevention
3. **Scale Up**: Zero-knowledge proofs for full privacy
4. **Optimize**: Move to efficient schemes like Pedersen commitments

### Common Pitfalls
- **Weak Randomness**: Always use cryptographically secure random numbers
- **Nonce Reuse**: Never reuse nonces in commitments
- **Missing Context**: Include context in nullifiers to prevent replay attacks
- **Storage Leaks**: Don't store secrets in plaintext

This document provides the foundation for understanding these concepts. Start with simple implementations and gradually add complexity as you become more comfortable with the underlying principles.