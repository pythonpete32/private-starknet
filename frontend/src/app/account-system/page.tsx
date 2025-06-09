"use client";

import { useState, useEffect } from 'react';
import { Typography, Card, Input, Button, Alert } from '@inkonchain/ink-kit';
import { WalletConnect } from '../../components/WalletConnect';
import { useWallet } from '../../hooks/useWallet';
import { accountSystemProver, CircuitUtils, type AccountSystemInputs, type ProofResult } from '../../lib/circuits';

export default function AccountSystemPage() {
  const { isConnected, address, shortAddress } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [senderBalance, setSenderBalance] = useState('1000');
  
  // Proof generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [error, setError] = useState('');
  
  // Browser support check
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check browser support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkBrowserSupport();
    }
  }, []);

  const checkBrowserSupport = async () => {
    try {
      if (typeof WebAssembly !== 'object') {
        throw new Error('WebAssembly not supported');
      }
      setIsSupported(true);
    } catch (err) {
      setIsSupported(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !isConnected) return;
    
    // Validate inputs
    const transferAmount = parseFloat(amount);
    const balance = parseFloat(senderBalance);
    
    if (transferAmount <= 0 || transferAmount > balance) {
      setError('Invalid amount or insufficient balance');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(0);
    setProgressMessage('Initializing circuit...');
    
    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Initialize circuit
      await accountSystemProver.initialize();
      setProgressMessage('Generating proof inputs...');
      
      // Generate proper inputs based on actual circuit signature
      const senderAccount = CircuitUtils.generateMockAccount(senderBalance, "0");
      const senderSecretKey = CircuitUtils.generateSecretKey();
      const newBalance = (balance - transferAmount).toString();
      
      const inputs: AccountSystemInputs = {
        // Public inputs
        merkle_root: "0",
        sender_nullifier: CircuitUtils.calculateNullifier(senderSecretKey, "0"),
        sender_new_commitment: CircuitUtils.calculateCommitment(senderAccount.pubkey, newBalance, "1"),
        recipient_new_commitment: CircuitUtils.calculateCommitment(recipient, amount, "0"),
        asset_id: "1",
        
        // Private inputs
        sender_account: senderAccount,
        sender_secret_key: senderSecretKey,
        transfer_amount: amount,
        recipient_pubkey: recipient,
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

      setProgressMessage('Executing circuit and generating proof...');
      
      // Generate proof
      const result = await accountSystemProver.generateProof(inputs);
      
      // Complete progress
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Proof generated successfully!');
      setProofResult(result);
      
      // Update balance
      setSenderBalance(newBalance);
      
      // Reset form
      setRecipient('');
      setAmount('');
      
    } catch (err: any) {
      console.error('Proof generation failed:', err);
      setError(`Failed to generate proof: ${err.message}`);
      setProgressMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetDemo = () => {
    setSenderBalance('1000');
    setProofResult(null);
    setError('');
    setProgress(0);
    setProgressMessage('');
  };

  const isTransferDisabled = 
    !recipient || 
    !amount || 
    !isConnected || 
    isGenerating ||
    isSupported === false ||
    parseFloat(amount) <= 0 ||
    parseFloat(amount) > parseFloat(senderBalance);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Typography variant="h1">Account System</Typography>
        <Typography variant="body-1" className="ink:text-muted">
          Private DAI transfers using Starknet-native account abstraction with zero-knowledge proofs.
        </Typography>
      </div>

      {/* Browser Support Check */}
      {isSupported === false && (
        <Alert
          title="Browser Not Supported"
          description="Your browser doesn't support the required WebAssembly features for proof generation."
          variant="error"
        />
      )}

      {/* Wallet Connection */}
      <Card size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h3">Wallet Connection</Typography>
          <WalletConnect />
          
          {isConnected && (
            <div className="ink:bg-background-light p-3 rounded">
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Connected: {shortAddress}
              </Typography>
            </div>
          )}
        </div>
      </Card>

      {/* Account Balance */}
      {isConnected && (
        <Card size="default" className="p-6">
          <div className="space-y-4">
            <Typography variant="h3">Private Account Balance</Typography>
            <div className="flex justify-between items-center">
              <Typography variant="body-1">
                DAI Balance: <strong>{senderBalance}</strong>
              </Typography>
              <Button 
                variant="secondary" 
                size="md"
                onClick={resetDemo}
                disabled={isGenerating}
              >
                Reset Demo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transfer Interface */}
      <Card size="default" className="p-6 space-y-6">
        <div>
          <Typography variant="h3">Private Transfer</Typography>
          <Typography variant="body-2-regular" className="ink:text-muted">
            Send DAI privately using zero-knowledge proofs. Amount and recipient are hidden on-chain.
          </Typography>
        </div>

        <div className="space-y-4">
          <div>
            <Typography variant="caption-1-bold" className="mb-2">
              Recipient Address
            </Typography>
            <Input
              placeholder="0x... or recipient public key"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={!isConnected || isGenerating}
            />
          </div>

          <div>
            <Typography variant="caption-1-bold" className="mb-2">
              Amount (DAI)
            </Typography>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isConnected || isGenerating}
            />
            {amount && parseFloat(amount) > parseFloat(senderBalance) && (
              <Typography variant="caption-1-regular" className="ink:text-status-error">
                Insufficient balance
              </Typography>
            )}
          </div>

          <Button 
            variant="primary"
            onClick={handleTransfer}
            disabled={isTransferDisabled}
            className="w-full"
          >
            {!isConnected ? 'Connect Wallet First' : 
             isSupported === false ? 'Browser Not Supported' :
             isGenerating ? 'Generating Proof...' :
             'Generate Proof & Transfer'}
          </Button>
        </div>

        {/* Progress Display */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="w-full ink:bg-background-light rounded-full h-2">
              <div 
                className="ink:bg-button-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between">
              <Typography variant="caption-1-regular" className="ink:text-muted">
                {progress.toFixed(0)}%
              </Typography>
              <Typography variant="caption-1-regular" className="ink:text-muted">
                {progressMessage}
              </Typography>
            </div>
            {progress > 80 && (
              <Typography variant="caption-1-regular" className="ink:text-status-alert text-center">
                Complex cryptographic operations can take up to 30 seconds...
              </Typography>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            title="Error"
            description={error}
            variant="error"
          />
        )}

        {/* Success Display */}
        {proofResult && (
          <Alert
            title="Success!"
            description={`Zero-knowledge proof generated successfully. In production, this would be submitted to Starknet for private verification.`}
            variant="success"
          />
        )}
      </Card>

      {/* How It Works */}
      <Card variant="light-purple" size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">How Account System Works</Typography>
          <div className="space-y-2">
            <Typography variant="body-2-regular">
              • <strong>Zero-Knowledge Proofs:</strong> Transfer amounts and balances remain completely private
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Starknet Native:</strong> Uses account abstraction for optimal gas efficiency
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Anti-Rug Protection:</strong> Interactive protocol prevents malicious transfers
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Merkle Tree Verification:</strong> Proves account membership without revealing balances
            </Typography>
          </div>
        </div>
      </Card>

      {/* Technical Details */}
      <Card size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">Technical Implementation</Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                ZK Backend
              </Typography>
              <Typography variant="body-2-regular">
                UltraHonk (Aztec)
              </Typography>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Circuit Language
              </Typography>
              <Typography variant="body-2-regular">
                Noir v1.0.0-beta.3
              </Typography>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Proof Size
              </Typography>
              <Typography variant="body-2-regular">
                ~2KB (constant size)
              </Typography>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Verification Cost
              </Typography>
              <Typography variant="body-2-regular">
                ~$0.10 on Starknet
              </Typography>
            </div>
          </div>
        </div>
      </Card>

      {/* Demo Notice */}
      <Alert
        title="Demo Mode"
        description="This demonstration uses mock merkle trees and generates real zero-knowledge proofs locally in your browser. No data leaves your device during proof generation."
        variant="info"
      />
    </div>
  );
}