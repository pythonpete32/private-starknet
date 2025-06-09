'use client';

import { useState } from "react";
import { Card, Typography, Button, Input } from "@inkonchain/ink-kit";
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../../hooks/useWallet';
import { CircuitManager } from '../../lib/circuits';
import type { AccountSystemInputs, ProofResult } from '../../lib/types';

export default function AccountSystemPage() {
  const { isConnected, address, shortAddress } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [error, setError] = useState('');

  const handleGenerateProof = async () => {
    if (!isConnected || !recipientAddress || !amount) return;
    
    setIsGenerating(true);
    setError('');
    setProgress('Generating proof...');
    
    try {
      const prover = await CircuitManager.getAccountSystemProver();
      
      // Generate mock inputs for demonstration
      const inputs: AccountSystemInputs = {
        sender_secret: Math.random().toString(),
        sender_balance: "1000", // Mock balance
        sender_nonce: "1",
        recipient_pubkey: recipientAddress,
        amount: amount,
        sender_merkle_path: new Array(20).fill("0"),
        merkle_root: "0",
        nullifier: "0",
        new_sender_commitment: "0",
        new_recipient_commitment: "0"
      };
      
      const result = await prover.generateProof(inputs);
      setProgress('Proof generated!');
      setProofResult(result);
      
    } catch (err: any) {
      console.error('Proof generation failed:', err);
      setError(`Failed to generate proof: ${err.message}`);
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerateProof = isConnected && recipientAddress && amount && !isGenerating;

  return (
    <div className="ink:min-h-screen ink:flex ink:flex-col ink:justify-center ink:max-w-2xl ink:mx-auto ink:px-8 ink:py-16">
      {/* Header */}
      <div className="ink:text-center ink:mb-12">
        <Typography variant="h1" className="ink:mb-4">
          Send DAI Privately
        </Typography>
        <Typography variant="subtitle-1" className="ink:text-muted">
          Account System • Recommended for most users
        </Typography>
      </div>

      {/* Wallet Connection Card */}
      {!isConnected ? (
        <Card className="ink:p-8 ink:mb-8">
          <WalletConnect />
        </Card>
      ) : (
        <Card className="ink:p-6 ink:mb-8 ink:text-center">
          <Typography variant="body-1" className="ink:text-muted">
            Connected: <span className="ink:font-mono">{shortAddress}</span>
          </Typography>
        </Card>
      )}

      {/* Transfer Form Card */}
      {isConnected && (
        <Card className="ink:p-8">
          <div className="ink:space-y-6">
            <div className="ink:text-center ink:mb-6">
              <Typography variant="h3">
                Private Transfer
              </Typography>
            </div>

            <div>
              <Typography variant="body-2" className="ink:font-medium ink:mb-3">
                To Address
              </Typography>
              <Input 
                placeholder="0x..."
                disabled={isGenerating}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>
            
            <div>
              <Typography variant="body-2" className="ink:font-medium ink:mb-3">
                Amount (DAI)
              </Typography>
              <Input 
                placeholder="0.00"
                disabled={isGenerating}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
              />
            </div>
            
            <Button 
              variant="primary" 
              className="ink:w-full ink:py-4"
              disabled={!canGenerateProof}
              onClick={handleGenerateProof}
            >
              {isGenerating ? 'Generating...' : 'Send Private Transfer'}
            </Button>
            
            {progress && (
              <div className="ink:text-center ink:py-4">
                <Typography variant="body-2" className="ink:text-accent">
                  {progress}
                </Typography>
              </div>
            )}
            
            {error && (
              <div className="ink:text-center ink:py-4">
                <Typography variant="body-2" className="ink:text-status-error">
                  {error}
                </Typography>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Success State Card */}
      {proofResult && (
        <Card className="ink:p-8 ink:mt-8 ink:text-center">
          <div className="ink:space-y-4">
            <Typography variant="h3" className="ink:text-accent">
              ✓ Transfer Ready
            </Typography>
            <Typography variant="body-1" className="ink:text-muted">
              Proof generated successfully
            </Typography>
            <Button variant="secondary" className="ink:w-full ink:py-4">
              Submit to Network
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}