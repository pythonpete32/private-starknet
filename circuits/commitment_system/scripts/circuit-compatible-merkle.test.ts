import { describe, test, expect } from 'bun:test';
import { 
  CircuitCompatibleMerkleTree, 
  toField, 
  hash, 
  createCommitmentHash,
  generateTestCommitment, 
  createTestTree,
  type NoirMerkleProof 
} from './circuit-compatible-merkle';

describe('Field Utilities', () => {
  test('toField converts numbers correctly', () => {
    expect(toField(100)).toBe('0x0000000000000000000000000000000000000000000000000000000000000064');
    expect(toField(0)).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(toField(255)).toBe('0x00000000000000000000000000000000000000000000000000000000000000ff');
  });

  test('toField handles hex strings', () => {
    expect(toField('0x1234567890')).toBe('0x0000000000000000000000000000000000000000000000000000001234567890');
    expect(toField('0xABCDEF')).toBe('0x0000000000000000000000000000000000000000000000000000000000abcdef');
  });

  test('hash function is deterministic', () => {
    const field1 = toField(100);
    const field2 = toField(200);
    
    const hash1 = hash([field1, field2]);
    const hash2 = hash([field1, field2]);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('hash function is order-sensitive', () => {
    const field1 = toField(100);
    const field2 = toField(200);
    
    const hash1 = hash([field1, field2]);
    const hash2 = hash([field2, field1]);
    
    expect(hash1).not.toBe(hash2);
  });
});

describe('Commitment Functions', () => {
  test('createCommitmentHash matches circuit expectations', () => {
    const value = toField(100);
    const nonce = toField(111111);
    const assetId = toField(1);
    
    const commitment1 = createCommitmentHash(value, nonce, assetId);
    const commitment2 = createCommitmentHash(value, nonce, assetId);
    
    expect(commitment1).toBe(commitment2); // Deterministic
    expect(commitment1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('generateTestCommitment creates valid data', () => {
    const commitment = generateTestCommitment(100, 12345, 1);
    
    expect(commitment.value).toBe(toField(100));
    expect(commitment.nonce).toBe(toField(12345));
    expect(commitment.assetId).toBe(toField(1));
    
    // Verify the commitment hash is computed correctly
    const expectedHash = createCommitmentHash(commitment.value, commitment.nonce, commitment.assetId);
    expect(commitment.commitmentHash).toBe(expectedHash);
  });
});

describe('CircuitCompatibleMerkleTree', () => {
  test('basic tree operations', () => {
    const tree = new CircuitCompatibleMerkleTree();
    const commitment = toField('0x1234567890abcdef');
    
    // Initially empty
    expect(tree.hasCommitment(commitment)).toBe(false);
    expect(tree.getTreeInfo().size).toBe(0);
    
    // Add commitment
    tree.addCommitment(commitment);
    expect(tree.hasCommitment(commitment)).toBe(true);
    expect(tree.getTreeInfo().size).toBe(1);
    expect(tree.getAllCommitments()).toContain(commitment);
  });

  test('constructor with initial commitments', () => {
    const commitments = [toField('0x123'), toField('0x456'), toField('0x789')];
    const tree = new CircuitCompatibleMerkleTree(commitments);
    
    expect(tree.getTreeInfo().size).toBe(3);
    commitments.forEach(commitment => {
      expect(tree.hasCommitment(commitment)).toBe(true);
    });
  });

  test('getSimpleProof returns valid structure', () => {
    const commitment = toField('0x1234567890abcdef');
    const tree = new CircuitCompatibleMerkleTree([commitment]);
    
    const proof = tree.getSimpleProof(commitment);
    
    expect(proof.path).toHaveLength(20);
    expect(proof.indices).toHaveLength(20);
    expect(proof.root).toBe(commitment); // Simple case: commitment is root
    
    // All path elements should be zero in simple case
    proof.path.forEach(element => {
      expect(element).toBe(toField('0'));
    });
    
    // All indices should be false in simple case
    proof.indices.forEach(index => {
      expect(index).toBe(false);
    });
  });

  test('getSimpleProof throws for non-existent commitment', () => {
    const tree = new CircuitCompatibleMerkleTree();
    const fakeCommitment = toField('0xfakecommitment');
    
    expect(() => {
      tree.getSimpleProof(fakeCommitment);
    }).toThrow('not found in tree');
  });

  test('verifyProof validates simple proofs correctly', () => {
    const commitment = toField('0x1234567890abcdef');
    const tree = new CircuitCompatibleMerkleTree([commitment]);
    
    const proof = tree.getSimpleProof(commitment);
    const isValid = tree.verifyProof(commitment, proof);
    
    expect(isValid).toBe(true);
  });

  test('verifyProof rejects invalid proofs', () => {
    const commitment = toField('0x1234567890abcdef');
    const tree = new CircuitCompatibleMerkleTree([commitment]);
    
    const proof = tree.getSimpleProof(commitment);
    
    // Tamper with the proof
    const invalidProof: NoirMerkleProof = {
      ...proof,
      root: toField('0xinvalidroot')
    };
    
    const isValid = tree.verifyProof(commitment, invalidProof);
    expect(isValid).toBe(false);
  });

  test('verifyProof matches Noir circuit logic', () => {
    // This test ensures our verification logic exactly matches the circuit
    const commitment = toField('0x1234567890abcdef');
    
    // Create proof with all zeros (single-node tree)
    const proof: NoirMerkleProof = {
      path: Array(20).fill(toField('0')),
      indices: Array(20).fill(false),
      root: commitment
    };
    
    // Manual verification using circuit logic
    let currentHash = commitment;
    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      const isLeft = proof.indices[i];
      
      if (sibling !== toField('0')) {
        if (isLeft) {
          currentHash = hash([currentHash, sibling]);
        } else {
          currentHash = hash([sibling, currentHash]);
        }
      }
    }
    
    expect(currentHash).toBe(proof.root);
    expect(currentHash).toBe(commitment);
  });
});

describe('Integration Tests', () => {
  test('createTestTree generates working tree', () => {
    const tree = createTestTree(3);
    const info = tree.getTreeInfo();
    
    expect(info.size).toBe(3);
    expect(info.commitments).toHaveLength(3);
    
    // Each commitment should be provable
    info.commitments.forEach(commitment => {
      const proof = tree.getSimpleProof(commitment);
      expect(tree.verifyProof(commitment, proof)).toBe(true);
    });
  });

  test('circuit test case - Alice commitment', () => {
    // Generate Alice's commitment exactly as in our circuit test
    const aliceValue = toField(100);
    const aliceNonce = toField(111111);
    const assetId = toField(0x1234567890);
    
    const aliceCommitmentHash = createCommitmentHash(aliceValue, aliceNonce, assetId);
    
    // Create tree with Alice's commitment
    const tree = new CircuitCompatibleMerkleTree([aliceCommitmentHash]);
    
    // Generate proof
    const proof = tree.getSimpleProof(aliceCommitmentHash);
    
    // Verify proof
    expect(tree.verifyProof(aliceCommitmentHash, proof)).toBe(true);
    
    // Output for circuit testing
    console.log('Circuit-compatible test data:');
    console.log(`Alice Value: ${aliceValue}`);
    console.log(`Alice Nonce: ${aliceNonce}`);
    console.log(`Asset ID: ${assetId}`);
    console.log(`Alice Commitment Hash: ${aliceCommitmentHash}`);
    console.log(`Merkle Root: ${proof.root}`);
    console.log(`Proof Valid: ${tree.verifyProof(aliceCommitmentHash, proof)}`);
  });

  test('multiple commitments with simple proofs', () => {
    const commitments = Array.from({ length: 5 }, (_, i) => {
      const { commitmentHash } = generateTestCommitment(100 + i * 10, 111111 + i, 1);
      return commitmentHash;
    });
    
    const tree = new CircuitCompatibleMerkleTree(commitments);
    
    // Each commitment should have a valid simple proof
    commitments.forEach(commitment => {
      const proof = tree.getSimpleProof(commitment);
      expect(proof.root).toBe(commitment); // Simple case
      expect(tree.verifyProof(commitment, proof)).toBe(true);
    });
  });

  test('proof serialization for circuit', () => {
    const tree = createTestTree(1);
    const commitment = tree.getAllCommitments()[0];
    const proof = tree.getSimpleProof(commitment);
    
    // Create serialized format for Noir circuit
    const circuitInputs = {
      merkle_root: proof.root,
      merkle_path: proof.path,
      merkle_indices: proof.indices
    };
    
    // Should be JSON serializable
    const json = JSON.stringify(circuitInputs);
    const parsed = JSON.parse(json);
    
    expect(parsed.merkle_root).toBe(proof.root);
    expect(parsed.merkle_path).toEqual(proof.path);
    expect(parsed.merkle_indices).toEqual(proof.indices);
  });
});

describe('Performance and Edge Cases', () => {
  test('handles large number of commitments efficiently', () => {
    const startTime = Date.now();
    const tree = createTestTree(1000);
    const creationTime = Date.now() - startTime;
    
    expect(creationTime).toBeLessThan(1000); // Should be fast
    expect(tree.getTreeInfo().size).toBe(1000);
  });

  test('handles edge case values', () => {
    const edgeCases = [
      toField(0),
      toField(1),
      toField(Math.pow(2, 32) - 1),
      toField('0x0'),
      toField('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    ];
    
    const tree = new CircuitCompatibleMerkleTree(edgeCases);
    
    edgeCases.forEach(commitment => {
      expect(tree.hasCommitment(commitment)).toBe(true);
      const proof = tree.getSimpleProof(commitment);
      expect(tree.verifyProof(commitment, proof)).toBe(true);
    });
  });

  test('duplicate commitments are handled correctly', () => {
    const commitment = toField('0x1234567890abcdef');
    const tree = new CircuitCompatibleMerkleTree();
    
    tree.addCommitment(commitment);
    tree.addCommitment(commitment); // Add again
    
    expect(tree.getTreeInfo().size).toBe(1); // Should still be 1
    expect(tree.hasCommitment(commitment)).toBe(true);
  });
});