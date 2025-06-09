'use client';

import { useState } from "react";
import { Typography, Button, Input } from "@inkonchain/ink-kit";
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
    <div className="ink:min-h-screen ink:flex ink:flex-col ink:justify-center ink:max-w-md ink:mx-auto ink:px-6">
      {/* Header */}
      <div className="ink:text-center ink:mb-8">
        <Typography variant="h1" className="ink:mb-2">
          Private Commitments
        </Typography>
        <Typography variant="body-1" className="ink:text-muted">
          Maximum Privacy System
        </Typography>
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div className="ink:mb-8">
          <WalletConnect />
        </div>
      ) : (
        <div className="ink:text-center ink:mb-6">
          <Typography variant="body-2" className="ink:text-muted">
            Connected: {shortAddress}
          </Typography>
        </div>
      )}

      {/* Commitment Form */}
      {isConnected && (
        <div className="ink:space-y-6">
          <div>
            <Typography variant="body-2" className="ink:font-medium ink:mb-2">
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
            <Typography variant="body-2" className="ink:font-medium ink:mb-2">
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
            className="ink:w-full ink:py-4"
            disabled={!canGenerateProof}
            onClick={handleGenerateProof}
          >
            {isGenerating ? 'Generating...' : 'Create Commitment'}
          </Button>
          
          {progress && (
            <div className="ink:text-center">
              <Typography variant="body-2" className="ink:text-accent">
                {progress}
              </Typography>
            </div>
          )}
          
          {error && (
            <div className="ink:text-center">
              <Typography variant="body-2" className="ink:text-status-error">
                {error}
              </Typography>
            </div>
          )}

          {proofResult && (
            <div className="ink:text-center ink:space-y-4 ink:pt-6">
              <Typography variant="h3" className="ink:text-accent">
                ✓ Commitment Ready
              </Typography>
              <Typography variant="body-2" className="ink:text-muted">
                Maximum privacy proof generated
              </Typography>
              <Button variant="secondary" className="ink:w-full">
                Submit to Network
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}