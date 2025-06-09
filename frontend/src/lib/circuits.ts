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

// Utility functions for circuit inputs
export class CircuitUtils {
  // Generate mock account for testing
  static generateMockAccount(balance: string = "1000", nonce: string = "0"): Account {
    return {
      pubkey: Math.random().toString().slice(2, 18), // Mock pubkey
      balance,
      nonce,
      asset_id: "1" // Default DAI asset ID
    };
  }

  // Generate mock merkle path (20 levels)
  static generateMockMerklePath(): string[] {
    return Array(20).fill("0");
  }

  // Generate mock merkle indices (20 levels)
  static generateMockMerkleIndices(): string[] {
    return Array(20).fill("0");
  }

  // Generate mock merkle indices as booleans for commitment system
  static generateMockMerkleIndicesBool(): boolean[] {
    return Array(20).fill(false);
  }

  // Generate a random secret key
  static generateSecretKey(): string {
    return Math.random().toString().slice(2, 18);
  }

  // Calculate nullifier (simplified - in production use proper hash)
  static calculateNullifier(secretKey: string, nonce: string): string {
    // Simplified nullifier calculation for demo
    return (BigInt(secretKey) + BigInt(nonce)).toString();
  }

  // Calculate commitment (simplified - in production use proper hash)
  static calculateCommitment(pubkey: string, balance: string, nonce: string): string {
    // Simplified commitment calculation for demo
    return (BigInt(pubkey) + BigInt(balance) + BigInt(nonce)).toString();
  }
}

// Export singleton instances
export const accountSystemProver = new AccountSystemProver();
export const commitmentSystemProver = new CommitmentSystemProver();