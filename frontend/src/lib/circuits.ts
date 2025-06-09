import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js'; // Using security-critical version
import type { AccountSystemInputs, CommitmentSystemInputs, ProofResult } from './types';

// Direct imports from compiled circuits - simplest approach
// Note: Type casting needed due to version compatibility between Nargo beta.6 and NoirJS beta.3
import accountCircuitRaw from '../../../circuits/account_system/target/account_system.json';
import commitmentCircuitRaw from '../../../circuits/commitment_system/target/commitment_system.json';

// Type cast the circuits to work with NoirJS beta.3
const accountCircuit = accountCircuitRaw as any;
const commitmentCircuit = commitmentCircuitRaw as any;

export class AccountSystemProver {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Initializing Account System circuit...');
      this.noir = new Noir(accountCircuit);
      this.backend = new UltraHonkBackend(accountCircuit.bytecode);
      this.initialized = true;
      console.log('Account System circuit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Account System circuit:', error);
      throw new Error(`Circuit initialization failed: ${error}`);
    }
  }

  async generateProof(inputs: AccountSystemInputs): Promise<ProofResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.noir || !this.backend) {
      throw new Error('Circuit not properly initialized');
    }

    try {
      console.log('Generating Account System proof...');
      console.log('Inputs:', inputs);
      
      // Execute the circuit to generate witness
      // Cast inputs to InputMap format expected by NoirJS beta.3
      const { witness } = await this.noir.execute(inputs as any);
      console.log('Witness generated successfully');
      
      // Generate the proof
      const proof = await this.backend.generateProof(witness);
      console.log('Account System proof generated successfully');
      
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs
      };
    } catch (error) {
      console.error('Account System proof generation failed:', error);
      throw new Error(`Proof generation failed: ${error}`);
    }
  }

  async verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
    if (!this.backend) {
      throw new Error('Backend not initialized');
    }

    try {
      return await this.backend.verifyProof({ proof, publicInputs });
    } catch (error) {
      console.error('Account System proof verification failed:', error);
      return false;
    }
  }
}

export class CommitmentSystemProver {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('Initializing Commitment System circuit...');
      this.noir = new Noir(commitmentCircuit);
      this.backend = new UltraHonkBackend(commitmentCircuit.bytecode);
      this.initialized = true;
      console.log('Commitment System circuit initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Commitment System circuit:', error);
      throw new Error(`Circuit initialization failed: ${error}`);
    }
  }

  async generateProof(inputs: CommitmentSystemInputs): Promise<ProofResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.noir || !this.backend) {
      throw new Error('Circuit not properly initialized');
    }

    try {
      console.log('Generating Commitment System proof...');
      console.log('Inputs:', inputs);
      
      // Execute the circuit to generate witness
      // Cast inputs to InputMap format expected by NoirJS beta.3
      const { witness } = await this.noir.execute(inputs as any);
      console.log('Witness generated successfully');
      
      // Generate the proof
      const proof = await this.backend.generateProof(witness);
      console.log('Commitment System proof generated successfully');
      
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs
      };
    } catch (error) {
      console.error('Commitment System proof generation failed:', error);
      throw new Error(`Proof generation failed: ${error}`);
    }
  }

  async verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
    if (!this.backend) {
      throw new Error('Backend not initialized');
    }

    try {
      return await this.backend.verifyProof({ proof, publicInputs });
    } catch (error) {
      console.error('Commitment System proof verification failed:', error);
      return false;
    }
  }
}

// Circuit factory for easier management
export class CircuitManager {
  private static accountProver: AccountSystemProver | null = null;
  private static commitmentProver: CommitmentSystemProver | null = null;

  static async getAccountSystemProver(): Promise<AccountSystemProver> {
    if (!this.accountProver) {
      this.accountProver = new AccountSystemProver();
      await this.accountProver.initialize();
    }
    return this.accountProver;
  }

  static async getCommitmentSystemProver(): Promise<CommitmentSystemProver> {
    if (!this.commitmentProver) {
      this.commitmentProver = new CommitmentSystemProver();
      await this.commitmentProver.initialize();
    }
    return this.commitmentProver;
  }

  // Helper method to generate mock inputs for testing
  static generateMockAccountInputs(): AccountSystemInputs {
    return {
      sender_secret: "123456789",
      sender_balance: "1000",
      sender_nonce: "1",
      recipient_pubkey: "987654321",
      amount: "100",
      sender_merkle_path: new Array(20).fill("0"),
      merkle_root: "0",
      nullifier: "0",
      new_sender_commitment: "0",
      new_recipient_commitment: "0"
    };
  }

  static generateMockCommitmentInputs(): CommitmentSystemInputs {
    return {
      sender_value: "1000",
      sender_nonce: "123456789",
      sender_asset_id: "1",
      recipient_value: "100",
      recipient_nonce: "987654321",
      recipient_asset_id: "1",
      transfer_amount: "100",
      sender_merkle_path: new Array(20).fill("0"),
      merkle_root: "0",
      nullifier: "0",
      new_sender_commitment: "0",
      new_recipient_commitment: "0"
    };
  }
}