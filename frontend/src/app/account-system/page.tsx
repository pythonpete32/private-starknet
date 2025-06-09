"use client";

import { useState, useEffect } from 'react';
import { Typography, Card, Input, Button, Alert } from '@inkonchain/ink-kit';
import { createAccountSystemProver, createPedersenHasher } from '../../lib/circuits-client';
import type { AccountSystemInputs, ProofResult } from '../../lib/circuits';

export default function AccountSystemPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [senderBalance, setSenderBalance] = useState('1000');
  
  // Wallet state
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [shortAddress, setShortAddress] = useState<string>('');
  
  // Proof generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [error, setError] = useState('');
  
  // Browser support check
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Listen for wallet connection events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWalletConnected = (event: any) => {
      const walletAddress = event.detail?.address || '';
      setAddress(walletAddress);
      setIsConnected(true);
      setShortAddress(walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '');
    };
    
    const handleWalletDisconnected = () => {
      setAddress('');
      setIsConnected(false);
      setShortAddress('');
    };

    // Check if already connected
    const storedAddress = localStorage.getItem('wallet_address');
    if (storedAddress) {
      setAddress(storedAddress);
      setIsConnected(true);
      setShortAddress(`${storedAddress.slice(0, 6)}...${storedAddress.slice(-4)}`);
    }

    window.addEventListener('walletConnected', handleWalletConnected);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);

    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
    };
  }, []);

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

      // Initialize circuit and hash utilities
      const prover = await createAccountSystemProver();
      const hasher = await createPedersenHasher();
      setProgressMessage('Generating proof inputs...');
      
      // Generate a deterministic secret key for demo
      const senderSecretKey = "12345";
      
      // Generate valid inputs step by step
      const assetId = "1";
      
      // Calculate sender's pubkey using actual pedersen hash
      const senderPubkey = await hasher.hashSingle(senderSecretKey);
      
      // Create sender's account
      const senderAccount = {
        pubkey: senderPubkey,
        balance: senderBalance,
        nonce: "0",
        asset_id: assetId
      };
      
      // Calculate sender's account commitment
      const senderCommitment = await hasher.hashQuadruple(
        senderAccount.pubkey,
        senderAccount.balance,
        senderAccount.nonce,
        senderAccount.asset_id
      );
      
      // Calculate nullifier
      const nullifier = await hasher.hashDouble(senderCommitment, senderSecretKey);
      
      // Calculate new sender account after sending
      const senderNewAccount = {
        pubkey: senderAccount.pubkey,
        balance: (BigInt(senderAccount.balance) - BigInt(amount)).toString(),
        nonce: (BigInt(senderAccount.nonce) + BigInt(1)).toString(),
        asset_id: senderAccount.asset_id
      };
      
      const senderNewCommitment = await hasher.hashQuadruple(
        senderNewAccount.pubkey,
        senderNewAccount.balance,
        senderNewAccount.nonce,
        senderNewAccount.asset_id
      );
      
      // For recipient, create a simple account and commitment
      const recipientOldBalance = "0";
      const recipientOldNonce = "0";
      const recipientNewAccount = {
        pubkey: recipient,
        balance: (BigInt(recipientOldBalance) + BigInt(amount)).toString(),
        nonce: (BigInt(recipientOldNonce) + BigInt(1)).toString(),
        asset_id: assetId
      };
      
      const recipientNewCommitment = await hasher.hashQuadruple(
        recipientNewAccount.pubkey,
        recipientNewAccount.balance,
        recipientNewAccount.nonce,
        recipientNewAccount.asset_id
      );
      
      const inputs: AccountSystemInputs = {
        // Public inputs
        merkle_root: senderCommitment, // Single leaf tree
        sender_nullifier: nullifier,
        sender_new_commitment: senderNewCommitment,
        recipient_new_commitment: recipientNewCommitment,
        asset_id: assetId,
        
        // Private inputs
        sender_account: senderAccount,
        sender_secret_key: senderSecretKey,
        transfer_amount: amount,
        recipient_pubkey: recipient,
        recipient_old_balance: recipientOldBalance,
        recipient_old_nonce: recipientOldNonce,
        sender_new_account: senderNewAccount,
        sender_merkle_path: Array(20).fill("0"),
        sender_merkle_indices: Array(20).fill("0")
      };

      console.log('🔍 Generated inputs that should satisfy ALL circuit constraints:', {
        ...inputs,
        explanation: {
          'pubkey_derivation': 'pubkey derived from secret_key',
          'merkle_tree': 'single-leaf tree (commitment = root)',
          'nullifier': 'hash of commitment + secret',
          'balance_check': `${senderBalance} >= ${amount}`,
          'account_transitions': 'using circuit send/receive methods'
        }
      });

      setProgressMessage('Executing circuit and generating proof...');
      
      // Generate proof
      const result = await prover.generateProof(inputs);
      
      console.log('🎉 Proof generated successfully! The circuit constraints were satisfied.');
      
      // Complete progress
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Proof generated successfully!');
      setProofResult(result);
      
      // Update balance
      const newBalance = (parseFloat(senderBalance) - parseFloat(amount)).toString();
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

      {/* Wallet Status */}
      {isConnected && (
        <Card size="default" className="p-6">
          <div className="space-y-4">
            <Typography variant="h3">Wallet Status</Typography>
            <div className="ink:bg-background-light p-3 rounded">
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Connected: {shortAddress}
              </Typography>
            </div>
          </div>
        </Card>
      )}

      {/* Account Balance */}
      {isConnected && (
        <Card size="default" className="p-6">
          <div className="space-y-4">
            <Typography variant="h3">Private Account Balance</Typography>
            <Typography variant="body-2-regular" className="ink:text-muted">
              This represents your private DAI balance committed to a Merkle tree. In production, this would come from deposits you made to the private system.
            </Typography>
            <div className="flex justify-between items-center">
              <Typography variant="body-1">
                DAI Balance: <strong>{senderBalance}</strong> (Demo)
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
        title="Demo Mode - Real ZK Proofs with Mock Data"
        description="This generates actual zero-knowledge proofs using your circuit, but with demo data: the 1000 DAI comes from a mock deposit, the Merkle tree contains only your account, and recipient addresses can be any value. In production, these would be real deposits and a global account tree."
        variant="info"
      />
    </div>
  );
}