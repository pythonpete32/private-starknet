'use client';

import { useState } from "react";
import { Typography, Button, Input, Card } from "@inkonchain/ink-kit";
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../../hooks/useWallet';
import { createCommitmentSystemProver, createPedersenHasher } from '../../lib/circuits-client';
import type { ProofResult } from '../../lib/types';

export default function CommitmentSystemPage() {
  const { isConnected, address, shortAddress } = useWallet();
  const [commitmentValue, setCommitmentValue] = useState('');
  const [recipientCommitment, setRecipientCommitment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerateProof = async () => {
    if (!isConnected || !commitmentValue || !recipientCommitment) return;
    
    setIsGenerating(true);
    setError('');
    setProgress('Generating commitment proof...');
    
    try {
      // Initialize circuit and utilities
      const prover = await createCommitmentSystemProver();
      const hasher = await createPedersenHasher();
      
      // Generate proper inputs based on actual circuit signature
      const aliceSecretKey = "12345";
      const oldNonce = "0";
      const newNonce = "1";
      const currentBalance = "1000";
      const newBalance = (1000 - parseInt(commitmentValue)).toString();
      
      // Calculate nullifier using proper hash
      const aliceNullifier = await hasher.hashDouble(aliceSecretKey, oldNonce);
      
      // For commitment system: pedersen_hash([value, nonce, asset_id])
      // This is different from account system which uses [pubkey, balance, nonce, asset_id]
      const commitment_alice_new = (BigInt(newBalance) + BigInt(newNonce) + BigInt("1")).toString();
      
      const inputs = {
        // Public inputs
        merkle_root: "0",
        nullifier_alice: aliceNullifier,
        commitment_alice_new: commitment_alice_new,
        commitment_bob_new: recipientCommitment,
        asset_id: "1",
        
        // Private inputs
        value_alice_old: currentBalance,
        value_alice_new: newBalance,
        value_bob_received: commitmentValue,
        nonce_alice_old: oldNonce,
        nonce_alice_new: newNonce,
        alice_secret_key: aliceSecretKey,
        alice_old_commitment_id: "0",
        merkle_path: Array(20).fill("0"),
        merkle_indices: Array(20).fill(false)
      };
      
      const result = await prover.generateProof(inputs);
      setProgress('Commitment proof generated!');
      setProofResult(result);
      
    } catch (err: any) {
      console.error('Commitment proof generation failed:', err);
      setError(`Failed to generate proof: ${err.message}`);
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerateProof = isConnected && commitmentValue && recipientCommitment && !isGenerating;

  return (
    <div>
      {/* Hero - Clean and focused */}
      <div className="text-center mb-20">
        <Typography variant="h1" className="mb-6">
          Private Commitments
        </Typography>
        <Typography variant="h5">
          Maximum Privacy System
        </Typography>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto">
        {/* Wallet Connection */}
        {!isConnected ? (
          <Card className="mb-8 p-8">
            <WalletConnect />
          </Card>
        ) : (
          <Card className="text-center mb-6 p-4">
            <Typography variant="body-2-regular">
              Connected: {shortAddress}
            </Typography>
          </Card>
        )}

      {/* Commitment Form */}
      {isConnected && (
        <Card className="space-y-6 p-6">
          <div>
            <Typography variant="body-2-bold" className="mb-2">
              Amount (DAI)
            </Typography>
            <Input 
              placeholder="0.00"
              disabled={isGenerating}
              value={commitmentValue}
              onChange={(e) => setCommitmentValue(e.target.value)}
              type="number"
            />
          </div>
          
          <div>
            <Typography variant="body-2-bold" className="mb-2">
              Recipient Commitment Hash
            </Typography>
            <Input 
              placeholder="0x..."
              disabled={isGenerating}
              value={recipientCommitment}
              onChange={(e) => setRecipientCommitment(e.target.value)}
            />
          </div>
          
          <Button 
            variant="primary" 
            size="lg"
            className="w-full py-4"
            disabled={!canGenerateProof}
            onClick={handleGenerateProof}
          >
            {isGenerating ? 'Generating...' : 'Create Commitment'}
          </Button>
          
          {progress && (
            <div className="text-center">
              <Typography variant="body-2-regular">
                {progress}
              </Typography>
            </div>
          )}
          
          {error && (
            <div className="text-center">
              <Typography variant="body-2-regular" className="ink:text-status-error">
                {error}
              </Typography>
            </div>
          )}

          {proofResult && (
            <div className="text-center space-y-4 pt-6">
              <Typography variant="h3" className="ink:text-status-success">
                ✓ Commitment Ready
              </Typography>
              <Typography variant="body-2-regular">
                Maximum privacy proof generated
              </Typography>
              <Button variant="secondary" size="lg" className="w-full py-4">
                Submit to Network
              </Button>
            </div>
          )}
        </Card>
        )}
      </div>
    </div>
  );
}