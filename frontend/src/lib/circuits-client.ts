/**
 * circuits-client.ts - Client-Only Circuit Functions
 * 
 * This file provides simplified, client-only functions for circuit operations.
 * It's designed to be used in React components and pages.
 * 
 * KEY DIFFERENCES FROM circuits.ts:
 * - This file: Simple factory functions, no classes, client-only
 * - circuits.ts: Full implementation with classes and utilities
 * 
 * WHEN TO USE THIS FILE:
 * - In React components that need to generate proofs
 * - In pages like account-system/page.tsx
 * - When you need simple async functions without managing class instances
 * 
 * WHEN TO USE circuits.ts:
 * - When you need TypeScript interfaces and types
 * - When building new circuit integrations
 * - When you need CircuitUtils for complex input generation
 * 
 * CURRENT USAGE:
 * - account-system/page.tsx uses createPedersenHasher() and createAccountSystemProver()
 * - commitment-system/page.tsx uses createCommitmentSystemProver()
 * 
 * HOW IT WORKS:
 * 1. Import circuit JSON dynamically (avoids SSR issues)
 * 2. Create Noir instance for circuit execution
 * 3. Return simple object with async methods
 * 4. No state management - creates new instances each time
 */

'use client';

// This module should only be imported on the client side
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend, Barretenberg, Fr } from '@aztec/bb.js';

// Client-only exports to prevent SSR issues
export const createPedersenHasher = async () => {
  const circuit = await import('../circuits/pedersen_hash_multi.json');
  const circuitData = circuit.default || circuit;
  
  return {
    async hashSingle(input: string): Promise<string> {
      const noir = new Noir(circuitData as any);
      const inputs = [input, "0", "0", "0"];
      const { returnValue } = await noir.execute({ 
        inputs, 
        input_count: "1" 
      });
      return returnValue.toString();
    },

    async hashDouble(input1: string, input2: string): Promise<string> {
      const noir = new Noir(circuitData as any);
      const inputs = [input1, input2, "0", "0"];
      const { returnValue } = await noir.execute({ 
        inputs, 
        input_count: "2" 
      });
      return returnValue.toString();
    },

    async hashQuadruple(input1: string, input2: string, input3: string, input4: string): Promise<string> {
      const noir = new Noir(circuitData as any);
      const inputs = [input1, input2, input3, input4];
      const { returnValue } = await noir.execute({ 
        inputs, 
        input_count: "4" 
      });
      return returnValue.toString();
    }
  };
};

export const createAccountSystemProver = async () => {
  const circuit = await import('../circuits/account_system.json');
  const circuitData = circuit.default || circuit;
  
  const noir = new Noir(circuitData as any);
  const backend = new UltraHonkBackend(circuitData.bytecode);

  return {
    async generateProof(inputs: any) {
      const { witness } = await noir.execute(inputs);
      const proof = await backend.generateProof(witness);
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    },

    async verifyProof(proof: any) {
      return await backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicInputs
      });
    }
  };
};

export const createCommitmentSystemProver = async () => {
  const circuit = await import('../circuits/commitment_system.json');
  const circuitData = circuit.default || circuit;
  
  const noir = new Noir(circuitData as any);
  const backend = new UltraHonkBackend(circuitData.bytecode);

  return {
    async generateProof(inputs: any) {
      const { witness } = await noir.execute(inputs);
      const proof = await backend.generateProof(witness);
      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs || []
      };
    },

    async verifyProof(proof: any) {
      return await backend.verifyProof({
        proof: proof.proof,
        publicInputs: proof.publicInputs
      });
    }
  };
};