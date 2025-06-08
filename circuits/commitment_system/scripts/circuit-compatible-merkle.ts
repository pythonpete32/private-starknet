import { createHash } from 'node:crypto';

// Field type for compatibility with Noir (32-byte hex string)
export type Field = string;

// Merkle proof structure matching our Noir circuit exactly
export interface NoirMerkleProof {
  path: Field[];
  indices: boolean[];
  root: Field;
}

// Convert to Field - simple and fast
export function toField(value: string | number | bigint): Field {
  if (typeof value === 'string' && value.startsWith('0x')) {
    // Remove 0x, pad to 64 chars, convert to lowercase, then add 0x back
    const hex = value.slice(2).toLowerCase().padStart(64, '0');
    return '0x' + hex;
  }
  
  const bigintValue = BigInt(value);
  return '0x' + bigintValue.toString(16).padStart(64, '0');
}

// Simple hash compatible with our test circuit (uses concatenation + SHA256)
export function hash(inputs: Field[]): Field {
  const combined = inputs.join('');
  const hashValue = createHash('sha256').update(combined).digest('hex');
  return '0x' + hashValue.padStart(64, '0');
}

// Very simple Merkle tree for testing our circuit
export class CircuitCompatibleMerkleTree {
  private commitments: Map<Field, boolean> = new Map();
  
  constructor(initialCommitments: Field[] = []) {
    initialCommitments.forEach(commitment => {
      this.commitments.set(commitment, true);
    });
  }

  public addCommitment(commitment: Field): void {
    this.commitments.set(commitment, true);
  }

  public hasCommitment(commitment: Field): boolean {
    return this.commitments.has(commitment);
  }

  public getAllCommitments(): Field[] {
    return Array.from(this.commitments.keys());
  }

  // For testing: generate a trivial proof where the commitment is the root
  // This matches our simplified circuit test case
  public getSimpleProof(commitment: Field): NoirMerkleProof {
    if (!this.hasCommitment(commitment)) {
      throw new Error(`Commitment ${commitment} not found in tree`);
    }

    // Simple case: commitment is the root (single-node tree)
    const path: Field[] = Array(20).fill(toField('0'));
    const indices: boolean[] = Array(20).fill(false);

    return {
      path,
      indices,
      root: commitment // Commitment itself is the root
    };
  }

  // Verify using the exact same logic as our Noir circuit
  public verifyProof(commitment: Field, proof: NoirMerkleProof): boolean {
    let currentHash = commitment;
    
    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      const isLeft = proof.indices[i];
      
      // Skip if sibling is zero (indicates empty path) - matches Noir circuit
      if (sibling !== toField('0')) {
        if (isLeft) {
          currentHash = hash([currentHash, sibling]);
        } else {
          currentHash = hash([sibling, currentHash]);
        }
      }
    }
    
    return currentHash === proof.root;
  }

  public getTreeInfo(): {
    size: number;
    commitments: Field[];
  } {
    return {
      size: this.commitments.size,
      commitments: this.getAllCommitments()
    };
  }
}

// Helper to create commitment hash (matches our circuit)
export function createCommitmentHash(value: Field, nonce: Field, assetId: Field): Field {
  return hash([value, nonce, assetId]);
}

// Helper to generate test data
export function generateTestCommitment(value: number, nonce?: number, assetId: number = 1): {
  commitmentHash: Field;
  value: Field;
  nonce: Field;
  assetId: Field;
} {
  const fieldValue = toField(value);
  const fieldNonce = toField(nonce ?? Math.floor(Math.random() * 1000000));
  const fieldAssetId = toField(assetId);
  
  return {
    commitmentHash: createCommitmentHash(fieldValue, fieldNonce, fieldAssetId),
    value: fieldValue,
    nonce: fieldNonce,
    assetId: fieldAssetId
  };
}

// Create a test tree with simple proofs
export function createTestTree(commitmentCount: number = 5): CircuitCompatibleMerkleTree {
  const commitments = Array.from({ length: commitmentCount }, (_, i) => {
    const { commitmentHash } = generateTestCommitment(100 + i * 10);
    return commitmentHash;
  });
  
  return new CircuitCompatibleMerkleTree(commitments);
}

export default CircuitCompatibleMerkleTree;