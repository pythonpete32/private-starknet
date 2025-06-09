// Type definitions for circuit inputs and proof generation

export interface AccountSystemInputs {
  // Private inputs (not revealed in proof)
  sender_secret: string;
  sender_balance: string;
  sender_nonce: string;
  recipient_pubkey: string;
  amount: string;
  sender_merkle_path: string[];
  
  // Public inputs (revealed in proof)
  merkle_root: string;
  nullifier: string;
  new_sender_commitment: string;
  new_recipient_commitment: string;
}

export interface CommitmentSystemInputs {
  // Private inputs
  sender_value: string;
  sender_nonce: string;
  sender_asset_id: string;
  recipient_value: string;
  recipient_nonce: string;
  recipient_asset_id: string;
  transfer_amount: string;
  sender_merkle_path: string[];
  
  // Public inputs
  merkle_root: string;
  nullifier: string;
  new_sender_commitment: string;
  new_recipient_commitment: string;
}

export interface ProofResult {
  proof: Uint8Array;
  publicInputs: string[];
}

export interface WalletConnection {
  account: any;
  address: string;
  provider: any;
}

export interface PrivateAccountState {
  version: number;
  accounts: Array<{
    commitment: string;
    balance: number;
    nonce: number;
    secretKey: string;
  }>;
  merkleRoot: string;
  merkleLeaves: string[];
  lastUpdate: number;
}

export interface ProofGenerationProgress {
  stage: 'initializing' | 'executing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  timeElapsed: number;
}

export type CircuitType = 'account' | 'commitment';

// Merkle tree types
export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  data?: any;
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
  root: string;
}

export interface TreeAccount {
  commitment: string;
  account: PrivateAccountState['accounts'][0] & { created: number };
  walletAddress: string;
  addedAt: number;
}