/**
 * circuits.ts - Main Circuit Management Module
 * 
 * This file contains:
 * 1. TypeScript interfaces for circuit inputs/outputs
 * 2. Circuit manager classes (AccountSystemProver, CommitmentSystemProver, etc.)
 * 3. Utility classes (CircuitUtils) for input preparation
 * 4. Hash computation helpers
 * 
 * KEY DIFFERENCES FROM circuits-client.ts:
 * - This file: Full implementation with classes, state management, and utilities
 * - circuits-client.ts: Simplified client-only factory functions for pages
 * 
 * WHEN TO USE THIS FILE:
 * - When you need the full circuit interfaces and types
 * - When building new circuit integrations
 * - When you need CircuitUtils for input generation
 * 
 * WHEN TO USE circuits-client.ts:
 * - In React components/pages that need to generate proofs
 * - When you want simple async functions without class management
 * - To avoid SSR issues with 'use client' directive
 * 
 * HOW IT WORKS:
 * 1. Initialize circuit: Load JSON, create Noir and Backend instances
 * 2. Generate inputs: Use CircuitUtils with PedersenHasher for correct hashes
 * 3. Execute circuit: Generate witness from inputs
 * 4. Create proof: Use UltraHonk backend to create ZK proof
 * 5. Verify proof: Optionally verify the proof is valid
 */

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend, Barretenberg, Fr } from '@aztec/bb.js';

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
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Account System circuit can only be initialized in browser environment');
      }

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
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Commitment System circuit can only be initialized in browser environment');
      }

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

// Pedersen hash utility using a separate Noir circuit
export class PedersenHasher {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Pedersen hasher can only be initialized in browser environment');
      }

      const circuit = await import('../circuits/pedersen_hash_multi.json');
      const circuitData = circuit.default || circuit;
      
      this.noir = new Noir(circuitData as any);
      this.backend = new UltraHonkBackend(circuitData.bytecode);
      
      this.isInitialized = true;
      console.log('Pedersen hasher initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pedersen hasher:', error);
      throw new Error('Failed to initialize Pedersen hasher');
    }
  }

  // Hash a single input (for pubkey generation)
  async hashSingle(input: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.noir) {
      throw new Error('Pedersen hasher not properly initialized');
    }

    try {
      const inputs = [input, "0", "0", "0"];
      const { returnValue } = await this.noir.execute({ 
        inputs, 
        input_count: "1" 
      });
      return returnValue.toString();
    } catch (error) {
      console.error('Pedersen hash calculation failed:', error);
      throw new Error(`Pedersen hash calculation failed: ${error}`);
    }
  }

  // Hash two inputs (for nullifiers)
  async hashDouble(input1: string, input2: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.noir) {
      throw new Error('Pedersen hasher not properly initialized');
    }

    try {
      const inputs = [input1, input2, "0", "0"];
      const { returnValue } = await this.noir.execute({ 
        inputs, 
        input_count: "2" 
      });
      return returnValue.toString();
    } catch (error) {
      console.error('Pedersen hash calculation failed:', error);
      throw new Error(`Pedersen hash calculation failed: ${error}`);
    }
  }

  // Hash four inputs (for account commitments)
  async hashQuadruple(input1: string, input2: string, input3: string, input4: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.noir) {
      throw new Error('Pedersen hasher not properly initialized');
    }

    try {
      const inputs = [input1, input2, input3, input4];
      const { returnValue } = await this.noir.execute({ 
        inputs, 
        input_count: "4" 
      });
      return returnValue.toString();
    } catch (error) {
      console.error('Pedersen hash calculation failed:', error);
      throw new Error(`Pedersen hash calculation failed: ${error}`);
    }
  }
}

// Alternative Pedersen hash using Barretenberg directly
export class BarretenbergPedersenHasher {
  private api: Barretenberg | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.api = await Barretenberg.new();
      this.isInitialized = true;
      console.log('Barretenberg Pedersen hasher initialized');
    } catch (error) {
      console.error('Failed to initialize Barretenberg hasher:', error);
      throw new Error('Failed to initialize Barretenberg hasher');
    }
  }

  async hash(input: string): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.api) {
      throw new Error('Barretenberg API not initialized');
    }

    try {
      // Convert string to Fr field element
      const inputFr = Fr.fromString(input);
      
      // Note: You'll need to find the exact Barretenberg pedersen hash method
      // This is a placeholder - the exact API may vary
      // const result = await this.api.pedersenHash([inputFr]);
      
      // For now, throw error since we're using the Noir circuit approach
      throw new Error("Barretenberg pedersen hash method not implemented yet - use PedersenHasher instead");
    } catch (error) {
      console.error('Barretenberg Pedersen hash failed:', error);
      throw new Error(`Barretenberg Pedersen hash failed: ${error}`);
    }
  }

  async destroy(): Promise<void> {
    if (this.api) {
      await this.api.destroy();
      this.api = null;
      this.isInitialized = false;
    }
  }
}

// Lazy singleton instances (only created when needed in browser)
let _pedersenHasher: PedersenHasher | null = null;
let _barretenbergHasher: BarretenbergPedersenHasher | null = null;

function getPedersenHasher(): PedersenHasher {
  if (!_pedersenHasher) {
    _pedersenHasher = new PedersenHasher();
  }
  return _pedersenHasher;
}

function getBarretenbergHasher(): BarretenbergPedersenHasher {
  if (!_barretenbergHasher) {
    _barretenbergHasher = new BarretenbergPedersenHasher();
  }
  return _barretenbergHasher;
}

// Utility functions for circuit inputs that match the exact circuit constraints
export class CircuitUtils {
  // Generate a proper secret key (deterministic for testing)
  static generateSecretKey(): string {
    // Use a fixed secret for demo consistency
    return "12345";
  }

  // Calculate pubkey using actual pedersen hash like the circuit expects
  static async calculatePubkey(secretKey: string): Promise<string> {
    // Use the same pedersen_hash([secret_key]) that the circuit uses
    return await getPedersenHasher().hashSingle(secretKey);
  }

  // Calculate account commitment hash (matches circuit's commitment_hash method)
  static async calculateAccountCommitment(pubkey: string, balance: string, nonce: string, assetId: string): Promise<string> {
    // Circuit uses: pedersen_hash([pubkey, balance, nonce, asset_id])
    return await getPedersenHasher().hashQuadruple(pubkey, balance, nonce, assetId);
  }

  // Calculate nullifier (matches circuit's Nullifier::new method)
  static async calculateNullifier(accountCommitment: string, secretKey: string): Promise<string> {
    // Circuit uses: pedersen_hash([account_commitment, secret_key])
    return await getPedersenHasher().hashDouble(accountCommitment, secretKey);
  }

  // Generate a valid account that will pass circuit verification
  static async generateValidAccount(secretKey: string, balance: string = "1000", nonce: string = "0"): Promise<Account> {
    const pubkey = await this.calculatePubkey(secretKey);
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
  static async generateValidTransferInputs(
    senderSecretKey: string,
    recipientPubkey: string,
    transferAmount: string,
    senderBalance: string = "1000"
  ): Promise<AccountSystemInputs> {
    const assetId = "1";
    
    // Create sender's account with proper pubkey derivation
    const senderAccount = await this.generateValidAccount(senderSecretKey, senderBalance, "0");
    
    // Calculate sender's account commitment
    const senderCommitment = await this.calculateAccountCommitment(
      senderAccount.pubkey,
      senderAccount.balance,
      senderAccount.nonce,
      senderAccount.asset_id
    );
    
    // Create merkle tree proof (single leaf for demo)
    const merkleProof = this.createSingleLeafMerkleProof(senderCommitment);
    
    // Calculate nullifier
    const nullifier = await this.calculateNullifier(senderCommitment, senderSecretKey);
    
    // Calculate new sender account after sending
    const senderNewAccount = this.calculateSentAccount(senderAccount, transferAmount);
    const senderNewCommitment = await this.calculateAccountCommitment(
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
    const recipientNewCommitment = await this.calculateAccountCommitment(
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

// Lazy singleton instances for provers (only created when needed in browser)
let _accountSystemProver: AccountSystemProver | null = null;
let _commitmentSystemProver: CommitmentSystemProver | null = null;

export function getAccountSystemProver(): AccountSystemProver {
  if (!_accountSystemProver) {
    _accountSystemProver = new AccountSystemProver();
  }
  return _accountSystemProver;
}

export function getCommitmentSystemProver(): CommitmentSystemProver {
  if (!_commitmentSystemProver) {
    _commitmentSystemProver = new CommitmentSystemProver();
  }
  return _commitmentSystemProver;
}

// NOTE: accountSystemProver and commitmentSystemProver exports removed to prevent SSR issues
// Use getAccountSystemProver() and getCommitmentSystemProver() functions instead
// Or better yet, use the client-only module: circuits-client.ts