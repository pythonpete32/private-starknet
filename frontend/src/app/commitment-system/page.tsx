'use client';

import { useState } from "react";
import { Typography, Button, Input, Card } from "@inkonchain/ink-kit";
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../../hooks/useWallet';
import { CircuitManager } from '../../lib/circuits';
import type { CommitmentSystemInputs, ProofResult } from '../../lib/types';

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
      const prover = await CircuitManager.getCommitmentSystemProver();
      
      // Generate mock inputs for demonstration
      const inputs: CommitmentSystemInputs = {
        sender_value: commitmentValue,
        sender_nonce: Math.random().toString(),
        sender_asset_id: "1",
        recipient_value: commitmentValue,
        recipient_nonce: recipientCommitment,
        recipient_asset_id: "1",
        transfer_amount: commitmentValue,
        sender_merkle_path: new Array(20).fill("0"),
        merkle_root: "0",
        nullifier: "0",
        new_sender_commitment: "0",
        new_recipient_commitment: "0"
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
            <Typography variant="body-2">
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
              <Typography variant="body-2">
                {progress}
              </Typography>
            </div>
          )}
          
          {error && (
            <div className="text-center">
              <Typography variant="body-2" className="ink:text-status-error">
                {error}
              </Typography>
            </div>
          )}

          {proofResult && (
            <div className="text-center space-y-4 pt-6">
              <Typography variant="h3" className="ink:text-status-success">
                ✓ Commitment Ready
              </Typography>
              <Typography variant="body-2">
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