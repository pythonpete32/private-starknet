import { createHash } from 'node:crypto';

// Field type for compatibility with Noir (32-byte hex string)
export type Field = string;

// Convert to Field - simple and fast
export function toField(value: string | number | bigint): Field {
  if (typeof value === 'string' && value.startsWith('0x')) {
    const hex = value.slice(2).toLowerCase().padStart(64, '0');
    return '0x' + hex;
  }
  
  const bigintValue = BigInt(value);
  return '0x' + bigintValue.toString(16).padStart(64, '0');
}

// Pedersen hash simulation using SHA256 (for testing)
export function pedersenHash(inputs: Field[]): Field {
  const combined = inputs.join('');
  const hashValue = createHash('sha256').update(combined).digest('hex');
  return '0x' + hashValue.padStart(64, '0');
}

// Account structure matching the Noir circuit
export interface Account {
  pubkey: Field;
  balance: Field;
  nonce: Field;
  asset_id: Field;
}

export class AccountSystem {
  // Create a new account
  static createAccount(
    secretKey: Field,
    balance: number | Field,
    nonce: number | Field,
    assetId: number | Field
  ): Account {
    const pubkey = pedersenHash([secretKey]);
    
    return {
      pubkey,
      balance: toField(balance),
      nonce: toField(nonce),
      asset_id: toField(assetId),
    };
  }

  // Generate account commitment hash for Merkle tree
  static getAccountCommitment(account: Account): Field {
    return pedersenHash([
      account.pubkey,
      account.balance,
      account.nonce,
      account.asset_id,
    ]);
  }

  // Create account after receiving tokens
  static accountReceive(account: Account, amount: number | Field): Account {
    const newBalance = BigInt(account.balance) + BigInt(toField(amount));
    const newNonce = BigInt(account.nonce) + 1n;
    
    return {
      ...account,
      balance: toField(newBalance.toString()),
      nonce: toField(newNonce.toString()),
    };
  }

  // Create account after sending tokens
  static accountSend(account: Account, amount: number | Field): Account {
    const newBalance = BigInt(account.balance) - BigInt(toField(amount));
    const newNonce = BigInt(account.nonce) + 1n;
    
    if (newBalance < 0n) {
      throw new Error('Insufficient balance');
    }
    
    return {
      ...account,
      balance: toField(newBalance.toString()),
      nonce: toField(newNonce.toString()),
    };
  }

  // Generate nullifier for account spending
  static generateNullifier(accountCommitment: Field, secretKey: Field): Field {
    return pedersenHash([accountCommitment, secretKey]);
  }

  // Verify account is valid
  static verifyAccount(account: Account): boolean {
    const balanceNum = BigInt(account.balance);
    const nonceNum = BigInt(account.nonce);
    const assetIdNum = BigInt(account.asset_id);
    
    return (
      balanceNum < 1000000000n && // Max 1B tokens
      nonceNum < 1000000000n &&   // Max 1B operations
      assetIdNum > 0n             // Valid asset ID
    );
  }
}

// Merkle tree utilities for account system
export interface AccountMerkleProof {
  root: Field;
  path: Field[];
  indices: Field[]; // 0 = left, 1 = right
}

export class AccountMerkleTree {
  private accounts: Map<Field, Account> = new Map();
  
  constructor(initialAccounts: Account[] = []) {
    initialAccounts.forEach(account => {
      const commitment = AccountSystem.getAccountCommitment(account);
      this.accounts.set(commitment, account);
    });
  }

  public addAccount(account: Account): void {
    const commitment = AccountSystem.getAccountCommitment(account);
    this.accounts.set(commitment, account);
  }

  public hasAccount(account: Account): boolean {
    const commitment = AccountSystem.getAccountCommitment(account);
    return this.accounts.has(commitment);
  }

  public getAllCommitments(): Field[] {
    return Array.from(this.accounts.keys());
  }

  // Generate simple proof for testing (account is root)
  public getSimpleProof(account: Account): AccountMerkleProof {
    const commitment = AccountSystem.getAccountCommitment(account);
    
    if (!this.accounts.has(commitment)) {
      throw new Error(`Account not found in tree`);
    }

    // Simple case: account commitment is the root
    const path: Field[] = Array(20).fill(toField('0'));
    const indices: Field[] = Array(20).fill(toField('0')); // All left children
    
    return {
      root: commitment,
      path,
      indices,
    };
  }

  // Verify proof using circuit logic
  public verifyProof(account: Account, proof: AccountMerkleProof): boolean {
    const commitment = AccountSystem.getAccountCommitment(account);
    let currentHash = commitment;
    
    for (let i = 0; i < proof.path.length; i++) {
      const sibling = proof.path[i];
      const direction = proof.indices[i];
      
      // Skip if sibling is zero
      if (sibling !== toField('0')) {
        if (direction === toField('0')) {
          // Current node is left child
          currentHash = pedersenHash([currentHash, sibling]);
        } else {
          // Current node is right child
          currentHash = pedersenHash([sibling, currentHash]);
        }
      }
    }
    
    return currentHash === proof.root;
  }

  public getTreeInfo(): {
    size: number;
    accounts: Account[];
    commitments: Field[];
  } {
    return {
      size: this.accounts.size,
      accounts: Array.from(this.accounts.values()),
      commitments: this.getAllCommitments(),
    };
  }
}

// Transfer utilities
export interface TransferData {
  sender: Account;
  recipient_old: Account;
  recipient_new: Account;
  transfer_amount: Field;
  sender_new: Account;
  sender_secret: Field;
  merkle_proof: AccountMerkleProof;
}

export class TransferSystem {
  // Create a complete transfer setup
  static createTransfer(
    senderSecret: Field,
    senderAccount: Account,
    recipientPubkey: Field,
    recipientOldAccount: Account,
    transferAmount: number | Field,
    tree: AccountMerkleTree
  ): TransferData {
    const amount = toField(transferAmount);
    
    // Verify sender has sufficient balance
    if (BigInt(senderAccount.balance) < BigInt(amount)) {
      throw new Error('Insufficient balance');
    }
    
    // Create new account states
    const senderNew = AccountSystem.accountSend(senderAccount, amount);
    const recipientNew = AccountSystem.accountReceive(recipientOldAccount, amount);
    
    // Get Merkle proof for sender
    const merkleProof = tree.getSimpleProof(senderAccount);
    
    return {
      sender: senderAccount,
      recipient_old: recipientOldAccount,
      recipient_new: recipientNew,
      transfer_amount: amount,
      sender_new: senderNew,
      sender_secret: senderSecret,
      merkle_proof: merkleProof,
    };
  }

  // Generate circuit inputs for the transfer
  static generateCircuitInputs(transfer: TransferData): {
    public_inputs: {
      merkle_root: Field;
      sender_nullifier: Field;
      sender_new_commitment: Field;
      recipient_new_commitment: Field;
      asset_id: Field;
    };
    private_inputs: {
      sender_account: Account;
      sender_secret_key: Field;
      transfer_amount: Field;
      recipient_pubkey: Field;
      recipient_old_balance: Field;
      recipient_old_nonce: Field;
      sender_new_account: Account;
      sender_merkle_path: Field[];
      sender_merkle_indices: Field[];
    };
  } {
    // Generate nullifier
    const senderCommitment = AccountSystem.getAccountCommitment(transfer.sender);
    const nullifier = AccountSystem.generateNullifier(senderCommitment, transfer.sender_secret);
    
    return {
      public_inputs: {
        merkle_root: transfer.merkle_proof.root,
        sender_nullifier: nullifier,
        sender_new_commitment: AccountSystem.getAccountCommitment(transfer.sender_new),
        recipient_new_commitment: AccountSystem.getAccountCommitment(transfer.recipient_new),
        asset_id: transfer.sender.asset_id,
      },
      private_inputs: {
        sender_account: transfer.sender,
        sender_secret_key: transfer.sender_secret,
        transfer_amount: transfer.transfer_amount,
        recipient_pubkey: transfer.recipient_old.pubkey,
        recipient_old_balance: transfer.recipient_old.balance,
        recipient_old_nonce: transfer.recipient_old.nonce,
        sender_new_account: transfer.sender_new,
        sender_merkle_path: transfer.merkle_proof.path,
        sender_merkle_indices: transfer.merkle_proof.indices,
      },
    };
  }
}

// Helper functions for testing
export function generateTestAccounts(count: number = 2): {
  accounts: Account[];
  secrets: Field[];
  tree: AccountMerkleTree;
} {
  const accounts: Account[] = [];
  const secrets: Field[] = [];
  
  for (let i = 0; i < count; i++) {
    const secret = toField('0x' + (0x1000 + i).toString(16));
    const account = AccountSystem.createAccount(
      secret,
      1000 + i * 100, // Different balances
      i, // Different nonces
      1 // Same asset
    );
    
    accounts.push(account);
    secrets.push(secret);
  }
  
  const tree = new AccountMerkleTree(accounts);
  
  return { accounts, secrets, tree };
}

export default {
  AccountSystem,
  AccountMerkleTree,
  TransferSystem,
  generateTestAccounts,
  toField,
  pedersenHash,
};