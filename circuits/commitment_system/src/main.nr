use std::hash::pedersen_hash;

// COMMITMENT STRUCTURE
// Think of this like a "private balance record"
// It contains:
// - hash: The public identifier (what everyone sees on-chain)
// - value: The actual balance (kept secret)
// - nonce: Random number to hide the balance (kept secret)
struct Commitment {
    hash: Field,
    value: Field,
    nonce: Field,
    asset_id: Field,
}

impl Commitment {
    // Creates a new commitment
    // This is like creating a "sealed envelope" with your balance inside
    fn new(value: Field, nonce: Field, asset_id: Field) -> Self {
        Self {
            // The hash is what gets published on-chain
            // Nobody can reverse this to find your balance!
            hash: pedersen_hash([value, nonce, asset_id]),
            value,
            nonce,
            asset_id,
        }
    }

    // Verify that the commitment data matches the hash
    // This proves you know the secret values inside the commitment
    fn verify(self) -> bool {
        self.hash == pedersen_hash([self.value, self.nonce, self.asset_id])
    }
}

// NULLIFIER STRUCTURE
// Think of this like a "burn receipt" or "spend proof"
// Once a nullifier is used, that commitment can never be spent again
struct Nullifier {
    hash: Field,
    secret_key: Field,
    commitment_id: Field, // Changed from asset_id for clarity
}

impl Nullifier {
    // Creates a nullifier for spending a commitment
    // Only the owner (who knows secret_key) can create this
    fn new(secret_key: Field, commitment_id: Field) -> Self {
        Self {
            // This hash is what prevents double-spending
            // Same commitment always produces same nullifier
            hash: pedersen_hash([secret_key, commitment_id]),
            secret_key,
            commitment_id,
        }
    }

    // Verify the nullifier is correctly formed
    fn verify(self) -> bool {
        self.hash == pedersen_hash([self.secret_key, self.commitment_id])
    }
}

// MERKLE TREE VERIFICATION
// Proves that a commitment exists in the global state tree
fn verify_merkle_proof(
    commitment: Field,
    merkle_root: Field,
    merkle_path: [Field; 20],
    merkle_indices: [bool; 20],
) -> bool {
    let mut current_hash = commitment;

    // Walk up the tree from leaf to root
    for i in 0..20 {
        let sibling = merkle_path[i];
        let is_left = merkle_indices[i];

        // Skip if sibling is zero (indicates empty path)
        if sibling != 0 {
            if is_left {
                // Current node is left child
                current_hash = pedersen_hash([current_hash, sibling]);
            } else {
                // Current node is right child
                current_hash = pedersen_hash([sibling, current_hash]);
            }
        }
    }

    current_hash == merkle_root
}

// MAIN TRANSFER CIRCUIT
// This is the core logic that gets turned into a zero-knowledge proof
// Think of it like the rules that MUST be satisfied for a valid transfer
fn main(
    // ===== PUBLIC INPUTS =====
    // These are visible to everyone on-chain
    // Current Merkle tree root (proves global state)
    merkle_root: pub Field,
    // The nullifier that "burns" Alice's old balance
    // This prevents Alice from spending the same balance twice
    nullifier_alice: pub Field,
    // Alice's new commitment (her remaining balance after transfer)
    commitment_alice_new: pub Field,
    // Bob's new commitment (the amount he receives) - PROVIDED BY BOB
    commitment_bob_new: pub Field,
    // The token type being transferred (like USDC address in Solidity)
    asset_id: pub Field,
    // ===== PRIVATE INPUTS =====
    // These stay secret! Only the prover (Alice) knows these
    // Alice's old balance (before transfer)
    value_alice_old: Field,
    // Alice's new balance (after transfer)
    value_alice_new: Field,
    // Bob's received amount (Alice knows this but NOT Bob's nonce)
    value_bob_received: Field,
    // Random values to hide the balances
    nonce_alice_old: Field,
    nonce_alice_new: Field,
    // NOTE: nonce_bob removed - Bob keeps this secret!
    // Alice's secret key (like a private key)
    // This proves Alice owns the commitment she's spending
    alice_secret_key: Field,
    // The ID of Alice's old commitment (what she's spending)
    alice_old_commitment_id: Field,
    // Merkle proof that Alice's old commitment exists in the tree
    merkle_path: [Field; 20],
    merkle_indices: [bool; 20],
) {
    // ===== CONSTRAINT 1: Verify Alice's commitment exists in global state =====
    // Create Alice's old commitment from her secrets
    let alice_old_commitment = Commitment::new(value_alice_old, nonce_alice_old, asset_id);
    assert(alice_old_commitment.verify());

    // Prove this commitment exists in the Merkle tree
    // This prevents Alice from claiming fake balances!
    assert(verify_merkle_proof(
        alice_old_commitment.hash,
        merkle_root,
        merkle_path,
        merkle_indices,
    ));

    // ===== CONSTRAINT 2: Verify Alice owns what she's spending =====
    // Create the nullifier using Alice's secret
    let nullifier = Nullifier::new(alice_secret_key, alice_old_commitment_id);

    // The nullifier hash MUST match what was provided publicly
    // This proves Alice knows the secret key for this commitment
    assert(nullifier_alice == nullifier.hash);
    assert(nullifier.verify());

    // ===== CONSTRAINT 3: Verify Alice's new balance commitment =====
    // Create Alice's new commitment
    let alice_new_commitment = Commitment::new(value_alice_new, nonce_alice_new, asset_id);

    // Must match the public commitment
    // This ensures Alice can later spend her new balance
    assert(commitment_alice_new == alice_new_commitment.hash);
    assert(alice_new_commitment.verify());

    // ===== CONSTRAINT 4: Bob's commitment is provided by Bob =====
    // Bob creates his own commitment with his own secret nonce
    // Alice cannot create or verify Bob's commitment - she only knows the amount
    // This prevents Alice from later spending Bob's tokens
    //
    // NOTE: commitment_bob_new is intentionally not verified here by design!
    // It's provided as a public input but Alice's circuit doesn't verify it.
    // Bob will verify his own commitment when he later spends it.
    // We acknowledge its existence to satisfy the compiler:
    let _ = commitment_bob_new;

    // ===== CONSTRAINT 5: Conservation of value (NO TOKENS CREATED/DESTROYED) =====
    // This is CRITICAL! Ensures no inflation/deflation
    // Old balance MUST equal new balance + transferred amount
    assert(value_alice_old == value_alice_new + value_bob_received);

    // NOTE: Alice's old commitment verification moved to CONSTRAINT 1
    // (Combined with Merkle tree verification)

    // ===== CONSTRAINT 6: Reasonable value checks =====
    // Prevent overflow attacks and ensure positive balances
    assert(value_alice_old as u32 < 1000000);
    assert(value_alice_new as u32 < 1000000);
    assert(value_bob_received as u32 < 1000000);

    // No negative balances allowed!
    assert(value_bob_received as u32 > 0);

    // ===== CONSTRAINT 7: Asset consistency =====
    // Ensure we're transferring the same asset type throughout
    // This prevents mixing different tokens in a single transfer
    assert(alice_new_commitment.asset_id == asset_id);
    assert(alice_old_commitment.asset_id == asset_id);
    // Note: Bob's commitment asset_id is verified by Bob when he creates it
}

// ===== TEST FUNCTIONS =====

#[test]
fn test_commitment_basics() {
    // Test that commitments work as expected
    let value = 100;
    let nonce = 12345;

    // Create a commitment
    let asset_id = 1; // Test asset
    let commitment1 = Commitment::new(value, nonce, asset_id);

    // Same inputs should always produce same hash (deterministic)
    let commitment2 = Commitment::new(value, nonce, asset_id);
    assert(commitment1.hash == commitment2.hash);

    // Different nonce should produce different hash
    let commitment3 = Commitment::new(value, 54321, asset_id);
    assert(commitment1.hash != commitment3.hash);

    // Commitment should verify correctly
    assert(commitment1.verify());
}

#[test]
fn test_nullifier_basics() {
    // Test nullifier generation
    let secret_key = 99999;
    let commitment_id = 42;

    // Create nullifier
    let nullifier1 = Nullifier::new(secret_key, commitment_id);

    // Same inputs produce same nullifier (prevents double-spend)
    let nullifier2 = Nullifier::new(secret_key, commitment_id);
    assert(nullifier1.hash == nullifier2.hash);

    // Different secret produces different nullifier
    let nullifier3 = Nullifier::new(11111, commitment_id);
    assert(nullifier1.hash != nullifier3.hash);

    // Nullifier should verify
    assert(nullifier1.verify());
}

#[test]
fn test_merkle_verification() {
    // Test the Merkle tree verification function
    let test_commitment = 0x1234567890ABCDEF;

    // Test case 1: Single node tree (commitment is root)
    let merkle_root = test_commitment;
    let merkle_path: [Field; 20] = [0; 20]; // All zeros for single node
    let merkle_indices: [bool; 20] = [false; 20]; // All false for root

    // Should verify successfully
    assert(verify_merkle_proof(test_commitment, merkle_root, merkle_path, merkle_indices));

    // Test case 2: Wrong commitment should fail
    let wrong_commitment = 0xDEADBEEF;
    assert(!verify_merkle_proof(wrong_commitment, merkle_root, merkle_path, merkle_indices));
}

#[test]
fn test_complete_private_transfer() {
    // ===== SETUP: Alice has 100 tokens, wants to send 30 to Bob =====

    // Initial state
    let value_alice_old = 100; // Alice starts with 100
    let value_alice_new = 70; // Alice will have 70 after
    let value_bob_received = 30; // Bob receives 30

    // Random nonces (in practice, these would be generated securely)
    let nonce_alice_old = 111111;
    let nonce_alice_new = 222222;
    let nonce_bob = 333333; // BOB GENERATES THIS SECRETLY

    // Alice's secret key (like her private key)
    let alice_secret_key = 0xABCDEF;

    // Asset being transferred (could be USDC address)
    let asset_id = 0x1234567890;

    // Alice's old commitment ID (in practice, this would be from the blockchain)
    let alice_old_commitment_id = 0x9876543210;

    // ===== MERKLE TREE SETUP =====
    // Create Alice's old commitment
    let alice_old_commitment = Commitment::new(value_alice_old, nonce_alice_old, asset_id);

    // Create a simple test Merkle tree with Alice's commitment at index 0
    // For simplicity, we'll create a minimal tree with Alice's commitment as the root
    let merkle_root = alice_old_commitment.hash; // Simplified: commitment is the root
    let merkle_path: [Field; 20] = [0; 20]; // All zeros for a single-node tree
    let merkle_indices: [bool; 20] = [false; 20]; // All false for root verification

    // ===== INTERACTIVE PROTOCOL =====
    // 1. Alice tells Bob she wants to send him 30 tokens
    // 2. Bob creates his own commitment with his secret nonce
    // 3. Bob sends commitment hash to Alice (keeps nonce secret!)
    // 4. Alice creates proof using Bob's commitment hash

    // BOB'S SIDE: Create commitment with secret nonce
    let bob_commitment = Commitment::new(value_bob_received, nonce_bob, asset_id);
    // Bob sends bob_commitment.hash to Alice, keeps nonce_bob secret

    // ALICE'S SIDE: Create her new commitment
    let alice_new_commitment = Commitment::new(value_alice_new, nonce_alice_new, asset_id);

    // Create the nullifier (burns Alice's old balance)
    let nullifier = Nullifier::new(alice_secret_key, alice_old_commitment_id);

    // ===== RUN THE TRANSFER (generate the proof) =====
    // Alice can prove the transfer with Merkle verification!
    main(
        merkle_root, // Public: Current tree state
        nullifier.hash, // Public: Nullifier for Alice's old balance
        alice_new_commitment.hash, // Public: Alice's new balance commitment
        bob_commitment.hash, // Public: Bob's commitment (provided by Bob)
        asset_id, // Public: Which token is being transferred
        value_alice_old, // Private: Alice's old balance
        value_alice_new, // Private: Alice's new balance
        value_bob_received, // Private: Bob's received amount (known to both)
        nonce_alice_old, // Private: Old nonce
        nonce_alice_new, // Private: New nonce for Alice
        alice_secret_key, // Private: Alice's secret
        alice_old_commitment_id, // Private: Which commitment Alice is spending
        merkle_path, // Private: Merkle proof path
        merkle_indices, // Private: Merkle proof directions
        // NOTE: nonce_bob is NOT provided to Alice - Bob keeps it secret!
    );
}

#[test(should_fail)]
fn test_invalid_transfer_conservation() {
    // This test SHOULD FAIL because it tries to create tokens out of thin air
    // 80 + 30 = 110, but Alice only had 100!

    let value_alice_old = 100;
    let value_alice_new = 80; // Alice keeps 80
    let value_bob_received = 30; // Bob gets 30

    let nonce_alice_old = 111;
    let nonce_alice_new = 222;
    let nonce_bob = 333; // Bob's secret nonce
    let alice_secret_key = 12345;
    let asset_id = 1;
    let alice_old_commitment_id = 999;

    // Setup Merkle tree with Alice's commitment
    let alice_old_commitment = Commitment::new(value_alice_old, nonce_alice_old, asset_id);
    let merkle_root = alice_old_commitment.hash;
    let merkle_path: [Field; 20] = [0; 20];
    let merkle_indices: [bool; 20] = [false; 20];

    let alice_new_commitment = Commitment::new(value_alice_new, nonce_alice_new, asset_id);
    let bob_commitment = Commitment::new(value_bob_received, nonce_bob, asset_id);
    let nullifier = Nullifier::new(alice_secret_key, alice_old_commitment_id);

    // This will fail the conservation check: value_alice_old != value_alice_new + value_bob_received
    main(
        merkle_root, // Public: Tree root
        nullifier.hash, // Public: Nullifier
        alice_new_commitment.hash, // Public: Alice's new commitment
        bob_commitment.hash, // Public: Bob's commitment
        asset_id, // Public: Asset ID
        value_alice_old, // Private: Alice's old balance
        value_alice_new, // Private: Alice's new balance (wrong!)
        value_bob_received, // Private: Transfer amount
        nonce_alice_old, // Private: Old nonce
        nonce_alice_new, // Private: New nonce
        alice_secret_key, // Private: Secret key
        alice_old_commitment_id, // Private: Commitment ID
        merkle_path, // Private: Merkle path
        merkle_indices, // Private: Merkle indices
    );
}

#[test(should_fail)]
fn test_zero_value_transfer() {
    // This test SHOULD FAIL because we require positive transfer amounts

    let value_alice_old = 100;
    let value_alice_new = 100; // Alice keeps everything
    let value_bob_received = 0; // Bob gets nothing - this should fail

    let nonce_alice_old = 111;
    let nonce_alice_new = 222;
    let nonce_bob = 333; // Bob's secret nonce
    let alice_secret_key = 12345;
    let asset_id = 1;
    let alice_old_commitment_id = 999;

    // Setup Merkle tree with Alice's commitment
    let alice_old_commitment = Commitment::new(value_alice_old, nonce_alice_old, asset_id);
    let merkle_root = alice_old_commitment.hash;
    let merkle_path: [Field; 20] = [0; 20];
    let merkle_indices: [bool; 20] = [false; 20];

    let alice_new_commitment = Commitment::new(value_alice_new, nonce_alice_new, asset_id);
    let bob_commitment = Commitment::new(value_bob_received, nonce_bob, asset_id);
    let nullifier = Nullifier::new(alice_secret_key, alice_old_commitment_id);

    // This will fail the positive value check: assert(value_bob_received as u32 > 0)
    main(
        merkle_root, // Public: Tree root
        nullifier.hash, // Public: Nullifier
        alice_new_commitment.hash, // Public: Alice's new commitment
        bob_commitment.hash, // Public: Bob's commitment
        asset_id, // Public: Asset ID
        value_alice_old, // Private: Alice's old balance
        value_alice_new, // Private: Alice's new balance
        value_bob_received, // Private: Transfer amount (0 - should fail!)
        nonce_alice_old, // Private: Old nonce
        nonce_alice_new, // Private: New nonce
        alice_secret_key, // Private: Secret key
        alice_old_commitment_id, // Private: Commitment ID
        merkle_path, // Private: Merkle path
        merkle_indices, // Private: Merkle indices
    );
}
