#!/usr/bin/env bun

import { 
  CircuitCompatibleMerkleTree, 
  toField, 
  createCommitmentHash,
  generateTestCommitment,
  type NoirMerkleProof 
} from './circuit-compatible-merkle';

// Generate Alice's commitment exactly as used in our circuit tests
function generateAliceTestData(): {
  commitment: { value: string; nonce: string; assetId: string };
  commitmentHash: string;
  transferData: { aliceNew: string; bobReceived: string };
} {
  const value = toField(100);
  const nonce = toField(111111);
  const assetId = toField(0x1234567890);
  
  const commitmentHash = createCommitmentHash(value, nonce, assetId);
  
  return {
    commitment: { value, nonce, assetId },
    commitmentHash,
    transferData: {
      aliceNew: toField(70),  // Alice keeps 70
      bobReceived: toField(30) // Bob gets 30
    }
  };
}

// Generate test data for our circuit
async function generateCircuitTestData() {
  console.log('🎯 Generating Circuit-Compatible Test Data\n');
  
  // Generate Alice's data
  const alice = generateAliceTestData();
  
  console.log('👩 Alice\'s Commitment Data:');
  console.log(`  Value: ${alice.commitment.value}`);
  console.log(`  Nonce: ${alice.commitment.nonce}`);
  console.log(`  Asset ID: ${alice.commitment.assetId}`);
  console.log(`  Commitment Hash: ${alice.commitmentHash}\n`);
  
  // Create tree with Alice's commitment (simple single-node case)
  console.log('🌳 Creating Simple Merkle Tree...');
  const tree = new CircuitCompatibleMerkleTree([alice.commitmentHash]);
  
  // Generate proof
  const proof = tree.getSimpleProof(alice.commitmentHash);
  
  console.log(`  Tree Size: 1 commitment`);
  console.log(`  Merkle Root: ${proof.root}`);
  console.log(`  Proof Type: Simple (commitment = root)\n`);
  
  // Verify proof
  console.log('✅ Verifying Proof...');
  const isValid = tree.verifyProof(alice.commitmentHash, proof);
  console.log(`  Proof Valid: ${isValid}\n`);
  
  // Generate transfer data
  console.log('💸 Transfer Data (Alice → Bob):');
  console.log(`  Alice Starts With: 100 tokens`);
  console.log(`  Alice Keeps: 70 tokens`);
  console.log(`  Bob Receives: 30 tokens\n`);
  
  // Output circuit test data
  console.log('📋 Circuit Test Inputs (Prover.toml format):');
  console.log('```toml');
  console.log('# Public inputs');
  console.log(`merkle_root = "${proof.root}"`);
  console.log('nullifier_alice = "0x0000000000000000000000000000000000000000000000000000000000000000" # Calculate from secrets');
  console.log('commitment_alice_new = "0x0000000000000000000000000000000000000000000000000000000000000000" # Calculate from new values');
  console.log('commitment_bob_new = "0x0000000000000000000000000000000000000000000000000000000000000000" # Bob provides this');
  console.log(`asset_id = "${alice.commitment.assetId}"`);
  console.log('');
  console.log('# Private inputs');
  console.log(`value_alice_old = "${alice.commitment.value}"`);
  console.log(`value_alice_new = "${alice.transferData.aliceNew}"`);
  console.log(`value_bob_received = "${alice.transferData.bobReceived}"`);
  console.log(`nonce_alice_old = "${alice.commitment.nonce}"`);
  console.log('nonce_alice_new = "222222" # Alice generates new random nonce');
  console.log('alice_secret_key = "0xABCDEF"');
  console.log('alice_old_commitment_id = "0x9876543210"');
  console.log('');
  console.log('# Merkle proof (all zeros for simple case)');
  console.log(`merkle_path = [${proof.path.map(p => `"${p}"`).join(', ')}]`);
  console.log(`merkle_indices = [${proof.indices.join(', ')}]`);
  console.log('```\n');
  
  // Save test data
  const testData = {
    alice: {
      commitment: alice.commitment,
      commitmentHash: alice.commitmentHash,
      transferData: alice.transferData
    },
    merkle: {
      root: proof.root,
      proof: proof,
      treeSize: 1
    },
    circuitInputs: {
      public: {
        merkle_root: proof.root,
        asset_id: alice.commitment.assetId
      },
      private: {
        value_alice_old: alice.commitment.value,
        value_alice_new: alice.transferData.aliceNew,
        value_bob_received: alice.transferData.bobReceived,
        nonce_alice_old: alice.commitment.nonce,
        merkle_path: proof.path,
        merkle_indices: proof.indices
      }
    },
    metadata: {
      generated: new Date().toISOString(),
      compatible: 'Noir circuit main.nr',
      description: 'Simple single-node Merkle tree test case'
    }
  };
  
  await Bun.write('circuit-test-data.json', JSON.stringify(testData, null, 2));
  console.log('💾 Test data saved to circuit-test-data.json');
  
  // Additional test with multiple commitments
  console.log('\n🔄 Generating Multi-Commitment Test Case...');
  
  const otherCommitments = Array.from({ length: 4 }, (_, i) => {
    const { commitmentHash } = generateTestCommitment(200 + i * 50, 555555 + i, 0x1234567890);
    return commitmentHash;
  });
  
  const multiTree = new CircuitCompatibleMerkleTree([alice.commitmentHash, ...otherCommitments]);
  const multiProof = multiTree.getSimpleProof(alice.commitmentHash);
  
  console.log(`  Tree Size: ${multiTree.getTreeInfo().size} commitments`);
  console.log(`  Alice's Root: ${multiProof.root} (still simple proof)`);
  console.log(`  All Proofs Valid: ${multiTree.getTreeInfo().commitments.every(c => 
    multiTree.verifyProof(c, multiTree.getSimpleProof(c))
  )}\n`);
  
  console.log('🎉 Circuit-compatible test data generation complete!');
  console.log('\nNext Steps:');
  console.log('1. Copy the Prover.toml data above to test the circuit');
  console.log('2. Run: nargo test');
  console.log('3. All tests should pass with the simplified Merkle verification');
  console.log('4. For production, upgrade to full Merkle tree with @openzeppelin/merkle-tree');
}

// Run if called directly
if (import.meta.main) {
  generateCircuitTestData().catch(console.error);
}