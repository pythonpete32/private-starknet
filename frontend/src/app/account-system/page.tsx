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
    <div>
      {/* Hero - Clean and focused */}
      <div className="text-center mb-20">
        <Typography variant="h1" className="mb-6">
          Send DAI Privately
        </Typography>
        <Typography variant="h5">
          Account System • Recommended for most users
        </Typography>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {/* Wallet Connection Card */}
        {!isConnected ? (
          <Card className="p-8 mb-8">
            <WalletConnect />
          </Card>
        ) : (
          <Card className="p-6 mb-8 text-center">
            <Typography variant="body-1">
              Connected: <span className="font-mono">{shortAddress}</span>
            </Typography>
          </Card>
        )}

      {/* Transfer Form Card */}
      {isConnected && (
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Typography variant="h3">
                Private Transfer
              </Typography>
            </div>

            <div>
              <Typography variant="body-2-bold" className="mb-3">
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
              <Typography variant="body-2-bold" className="mb-3">
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
              size="lg"
              className="w-full py-4"
              disabled={!canGenerateProof}
              onClick={handleGenerateProof}
            >
              {isGenerating ? 'Generating...' : 'Send Private Transfer'}
            </Button>
            
            {progress && (
              <div className="text-center py-4">
                <Typography variant="body-2">
                  {progress}
                </Typography>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
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
        <Card className="p-8 mt-8 text-center">
          <div className="space-y-4">
            <Typography variant="h3" className="ink:text-status-success">
              ✓ Transfer Ready
            </Typography>
            <Typography variant="body-1">
              Proof generated successfully
            </Typography>
            <Button variant="secondary" size="lg" className="w-full py-4">
              Submit to Network
            </Button>
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}