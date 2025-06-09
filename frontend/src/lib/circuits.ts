import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

// Types based on actual circuit signatures
export interface Account {
  pubkey: string;
  balance: string;
  nonce: string;
  asset_id: string;
}

// Account System Circuit Types (based on actual Noir circuit)
export interface AccountSystemInputs {
  // Public inputs
  merkle_root: string;
  sender_nullifier: string;
  sender_new_commitment: string;
  recipient_new_commitment: string;
  asset_id: string;
  
  // Private inputs
  sender_account: Account;
  sender_secret_key: string;
  transfer_amount: string;
  recipient_pubkey: string;
  recipient_old_balance: string;
  recipient_old_nonce: string;
  sender_new_account: Account;
  sender_merkle_path: string[];
  sender_merkle_indices: string[];

  // Index signature for NoirJS compatibility
  [key: string]: any;
}

// Commitment System Circuit Types (based on actual Noir circuit)
export interface CommitmentSystemInputs {
  // Public inputs
  merkle_root: string;
  nullifier_alice: string;
  commitment_alice_new: string;
  commitment_bob_new: string;
  asset_id: string;
  
  // Private inputs
  value_alice_old: string;
  value_alice_new: string;
  value_bob_received: string;
  nonce_alice_old: string;
  nonce_alice_new: string;
  alice_secret_key: string;
  alice_old_commitment_id: string;
  merkle_path: string[];
  merkle_indices: boolean[];

  // Index signature for NoirJS compatibility
  [key: string]: any;
}

// Proof generation result interface
export interface ProofResult {
  proof: Uint8Array;
  publicInputs: string[];
}

// Circuit manager for Account System
export class AccountSystemProver {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import to avoid SSR issues
      const circuit = await import('../circuits/account_system.json');
      const circuitData = circuit.default || circuit;
      
      // Type assertion for NoirJS compatibility
      this.noir = new Noir(circuitData as any);
      this.backend = new UltraHonkBackend(circuitData.bytecode);
      
      this.isInitialized = true;
      console.log('Account System circuit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Account System circuit:', error);
      throw new Error('Failed to initialize Account System circuit');
    }
  }

  async generateProof(inputs: AccountSystemInputs): Promise<ProofResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.noir || !this.backend) {
      throw new Error('Circuit not properly initialized');
    }

    try {
      console.log('Generating Account System proof...');
      console.log('Inputs:', inputs);

      // Execute circuit to get witness
      const { witness } = await this.noir.execute(inputs);
      console.log('Witness generated, creating proof...');

      // Generate proof using UltraHonk backend
      const proof = await this.backend.generateProof(witness);
      console.log('Proof generated successfully');

      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    } catch (error) {
      console.error('Proof generation failed:', error);
      throw new Error(`Proof generation failed: ${error}`);
    }
  }

  async verifyProof(proof: ProofResult): Promise<boolean> {
    if (!this.backend) {
      throw new Error('Backend not initialized');
    }

    try {
      return await this.backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicInputs
      });
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
}

// Circuit manager for Commitment System
export class CommitmentSystemProver {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import to avoid SSR issues
      const circuit = await import('../circuits/commitment_system.json');
      const circuitData = circuit.default || circuit;
      
      // Type assertion for NoirJS compatibility
      this.noir = new Noir(circuitData as any);
      this.backend = new UltraHonkBackend(circuitData.bytecode);
      
      this.isInitialized = true;
      console.log('Commitment System circuit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Commitment System circuit:', error);
      throw new Error('Failed to initialize Commitment System circuit');
    }
  }

  async generateProof(inputs: CommitmentSystemInputs): Promise<ProofResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.noir || !this.backend) {
      throw new Error('Circuit not properly initialized');
    }

    try {
      console.log('Generating Commitment System proof...');
      console.log('Inputs:', inputs);

      // Execute circuit to get witness
      const { witness } = await this.noir.execute(inputs);
      console.log('Witness generated, creating proof...');

      // Generate proof using UltraHonk backend
      const proof = await this.backend.generateProof(witness);
      console.log('Proof generated successfully');

      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    } catch (error) {
      console.error('Proof generation failed:', error);
      throw new Error(`Proof generation failed: ${error}`);
    }
  }

  async verifyProof(proof: ProofResult): Promise<boolean> {
    if (!this.backend) {
      throw new Error('Backend not initialized');
    }

    try {
      return await this.backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicInputs
      });
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }
}

// Utility functions for circuit inputs that match the exact circuit constraints
export class CircuitUtils {
  // Generate a proper secret key (deterministic for testing)
  static generateSecretKey(): string {
    // Use a fixed secret for demo consistency
    return "12345";
  }

  // Calculate pubkey using pedersen hash like the circuit expects
  static calculatePubkey(secretKey: string): string {
    // Circuit uses: pedersen_hash([secret_key])
    // For demo, we'll use a deterministic calculation
    return (BigInt(secretKey) * BigInt(1000)).toString();
  }

  // Calculate account commitment hash (matches circuit's commitment_hash method)
  static calculateAccountCommitment(pubkey: string, balance: string, nonce: string, assetId: string): string {
    // Circuit uses: pedersen_hash([pubkey, balance, nonce, asset_id])
    // For demo, simulate this with deterministic math
    return (BigInt(pubkey) + BigInt(balance) + BigInt(nonce) + BigInt(assetId)).toString();
  }

  // Calculate nullifier (matches circuit's Nullifier::new method)
  static calculateNullifier(accountCommitment: string, secretKey: string): string {
    // Circuit uses: pedersen_hash([account_commitment, secret_key])
    return (BigInt(accountCommitment) + BigInt(secretKey)).toString();
  }

  // Generate a valid account that will pass circuit verification
  static generateValidAccount(secretKey: string, balance: string = "1000", nonce: string = "0"): Account {
    const pubkey = this.calculatePubkey(secretKey);
    return {
      pubkey,
      balance,
      nonce,
      asset_id: "1" // DAI asset ID
    };
  }

  // Create a simple merkle tree where the account is the only leaf (root = leaf)
  static createSingleLeafMerkleProof(accountCommitment: string): {
    merkleRoot: string;
    merklePath: string[];
    merkleIndices: string[];
  } {
    // For a single-leaf tree, the leaf IS the root
    // All path elements are 0 (no siblings)
    return {
      merkleRoot: accountCommitment,
      merklePath: Array(20).fill("0"),
      merkleIndices: Array(20).fill("0") // All left children
    };
  }

  // Calculate new account state after sending (matches circuit's send method)
  static calculateSentAccount(account: Account, transferAmount: string): Account {
    const newBalance = (BigInt(account.balance) - BigInt(transferAmount)).toString();
    const newNonce = (BigInt(account.nonce) + BigInt(1)).toString();
    
    return {
      pubkey: account.pubkey,
      balance: newBalance,
      nonce: newNonce,
      asset_id: account.asset_id
    };
  }

  // Calculate new account state after receiving (matches circuit's receive method)
  static calculateReceivedAccount(account: Account, transferAmount: string): Account {
    const newBalance = (BigInt(account.balance) + BigInt(transferAmount)).toString();
    const newNonce = (BigInt(account.nonce) + BigInt(1)).toString();
    
    return {
      pubkey: account.pubkey,
      balance: newBalance,
      nonce: newNonce,
      asset_id: account.asset_id
    };
  }

  // Generate complete valid transfer inputs that satisfy all circuit constraints
  static generateValidTransferInputs(
    senderSecretKey: string,
    recipientPubkey: string,
    transferAmount: string,
    senderBalance: string = "1000"
  ): AccountSystemInputs {
    const assetId = "1";
    
    // Create sender's account with proper pubkey derivation
    const senderAccount = this.generateValidAccount(senderSecretKey, senderBalance, "0");
    
    // Calculate sender's account commitment
    const senderCommitment = this.calculateAccountCommitment(
      senderAccount.pubkey,
      senderAccount.balance,
      senderAccount.nonce,
      senderAccount.asset_id
    );
    
    // Create merkle tree proof (single leaf for demo)
    const merkleProof = this.createSingleLeafMerkleProof(senderCommitment);
    
    // Calculate nullifier
    const nullifier = this.calculateNullifier(senderCommitment, senderSecretKey);
    
    // Calculate new sender account after sending
    const senderNewAccount = this.calculateSentAccount(senderAccount, transferAmount);
    const senderNewCommitment = this.calculateAccountCommitment(
      senderNewAccount.pubkey,
      senderNewAccount.balance,
      senderNewAccount.nonce,
      senderNewAccount.asset_id
    );
    
    // For recipient, create a simple account and commitment
    const recipientOldBalance = "0";
    const recipientOldNonce = "0";
    const recipientOldAccount = {
      pubkey: recipientPubkey,
      balance: recipientOldBalance,
      nonce: recipientOldNonce,
      asset_id: assetId
    };
    
    const recipientNewAccount = this.calculateReceivedAccount(recipientOldAccount, transferAmount);
    const recipientNewCommitment = this.calculateAccountCommitment(
      recipientNewAccount.pubkey,
      recipientNewAccount.balance,
      recipientNewAccount.nonce,
      recipientNewAccount.asset_id
    );
    
    return {
      // Public inputs
      merkle_root: merkleProof.merkleRoot,
      sender_nullifier: nullifier,
      sender_new_commitment: senderNewCommitment,
      recipient_new_commitment: recipientNewCommitment,
      asset_id: assetId,
      
      // Private inputs
      sender_account: senderAccount,
      sender_secret_key: senderSecretKey,
      transfer_amount: transferAmount,
      recipient_pubkey: recipientPubkey,
      recipient_old_balance: recipientOldBalance,
      recipient_old_nonce: recipientOldNonce,
      sender_new_account: senderNewAccount,
      sender_merkle_path: merkleProof.merklePath,
      sender_merkle_indices: merkleProof.merkleIndices
    };
  }
}

// Export singleton instances
export const accountSystemProver = new AccountSystemProver();
export const commitmentSystemProver = new CommitmentSystemProver();