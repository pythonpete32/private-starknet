'use client';

import { useState } from "react";
import { Card, Typography, Button, Input } from "@inkonchain/ink-kit";
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../../hooks/useWallet';
import { accountSystemProver, CircuitUtils } from '../../lib/circuits';
import type { ProofResult } from '../../lib/types';

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
      await accountSystemProver.initialize();
      
      // Generate proper inputs based on actual circuit signature
      const senderAccount = CircuitUtils.generateMockAccount("1000", "0");
      const senderSecretKey = CircuitUtils.generateSecretKey();
      const newBalance = (1000 - parseInt(amount)).toString();
      
      const inputs = {
        // Public inputs
        merkle_root: "0",
        sender_nullifier: CircuitUtils.calculateNullifier(senderSecretKey, "0"),
        sender_new_commitment: CircuitUtils.calculateCommitment(senderAccount.pubkey, newBalance, "1"),
        recipient_new_commitment: CircuitUtils.calculateCommitment(recipientAddress, amount, "0"),
        asset_id: "1",
        
        // Private inputs
        sender_account: senderAccount,
        sender_secret_key: senderSecretKey,
        transfer_amount: amount,
        recipient_pubkey: recipientAddress,
        recipient_old_balance: "0",
        recipient_old_nonce: "0",
        sender_new_account: {
          ...senderAccount,
          balance: newBalance,
          nonce: "1"
        },
        sender_merkle_path: CircuitUtils.generateMockMerklePath(),
        sender_merkle_indices: CircuitUtils.generateMockMerkleIndices()
      };
      
      const result = await accountSystemProver.generateProof(inputs);
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
                <Typography variant="body-2-regular">
                  {progress}
                </Typography>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <Typography variant="body-2-regular" className="ink:text-status-error">
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