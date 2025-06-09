"use client";

import { useState, useEffect } from 'react';
import { Typography, Card, Input, Button, Alert, InkPageLayout } from '@inkonchain/ink-kit';
import { createAccountSystemProver, createPedersenHasher } from '../../lib/circuits-client';
import type { ProofResult } from '../../lib/circuits';
import { AccountManager } from '@/components/AccountManager';
import { TreeViewer } from '@/components/TreeViewer';
import { AccountStorage, PrivateAccount } from '@/lib/accountStorage';
import { AccountHelpers } from '@/lib/accountHelpers';
import { DemoMerkleTreeManager } from '@/lib/treeManager';
import { useWalletContext } from '@/app/providers';

export default function AccountSystemPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<PrivateAccount | null>(null);
  
  // Use unified wallet system
  const { address, isConnected } = useWalletContext();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  
  // Tree manager instance
  const [treeManager] = useState(() => new DemoMerkleTreeManager());
  const [activeTab, setActiveTab] = useState<'transfer' | 'tree'>('transfer');
  
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
  
  // Handle account selection and ensure account is in tree
  const handleAccountSelected = async (account: PrivateAccount | null) => {
    setSelectedAccount(account);
    
    if (account && address) {
      // Ensure account is in tree
      const isInTree = await treeManager.hasAccount(account);
      if (!isInTree) {
        await treeManager.addAccount(account, address);
        console.log('✅ Added existing account to tree:', {
          pubkey: account.pubkey.slice(0, 10) + '...',
          balance: account.balance,
          treeStats: treeManager.getStats()
        });
      }
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !isConnected) return;
    
    if (!selectedAccount) {
      setError('Please select an account first');
      return;
    }
    
    // Validate inputs
    const transferAmount = parseFloat(amount);
    const accountBalance = parseFloat(selectedAccount.balance);
    
    if (transferAmount <= 0 || transferAmount > accountBalance) {
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
      
      // Use selected account data
      const senderSecretKey = selectedAccount.secretKey;
      const assetId = selectedAccount.asset_id;
      
      console.log('🔍 USING SELECTED ACCOUNT:');
      console.log('Secret Key:', senderSecretKey);
      console.log('Selected Account:', selectedAccount);
      
      // Verify pubkey matches secret key
      const derivedPubkey = await hasher.hashSingle(senderSecretKey);
      console.log('Expected Pubkey from secret:', derivedPubkey);
      console.log('Account Pubkey:', selectedAccount.pubkey);
      console.log('Pubkey match:', derivedPubkey === selectedAccount.pubkey);
      
      // Create sender's account for circuit
      const senderAccount = {
        pubkey: selectedAccount.pubkey,
        balance: selectedAccount.balance,
        nonce: selectedAccount.nonce,
        asset_id: selectedAccount.asset_id
      };
      console.log('Sender Account for circuit:', senderAccount);
      
      // Calculate sender's account commitment
      const senderCommitment = await hasher.hashQuadruple(
        senderAccount.pubkey,
        senderAccount.balance,
        senderAccount.nonce,
        senderAccount.asset_id
      );
      console.log('Sender Commitment:', senderCommitment);
      
      // Verify the circuit's expectation: pubkey should equal pedersen_hash([secret_key])
      // This is the constraint that's failing - let's test it explicitly
      const expectedPubkey = await hasher.hashSingle(senderSecretKey);
      console.log('Expected Pubkey:', expectedPubkey);
      console.log('Pubkey Match:', selectedAccount.pubkey === expectedPubkey);
      
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
      
      // Generate real merkle proof from tree
      setProgressMessage('Generating merkle proof...');
      const merkleProof = await treeManager.generateProof(selectedAccount);
      
      if (!merkleProof) {
        throw new Error('Failed to generate merkle proof. Account may not be in tree.');
      }
      
      console.log('🌳 MERKLE PROOF GENERATED:', {
        leaf: merkleProof.leaf.slice(0, 10) + '...',
        root: merkleProof.root.slice(0, 10) + '...',
        pathLength: merkleProof.path.length,
        indicesLength: merkleProof.indices.length,
        isRealProof: merkleProof.path.some(p => p !== "0") || merkleProof.indices.some(i => i !== 0)
      });
      
      // CRITICAL FIX: Circuit expects structured inputs matching Account struct and array formats
      const inputs = {
        // Public inputs (circuit main function parameters)
        merkle_root: merkleProof.root,
        sender_nullifier: nullifier,
        sender_new_commitment: senderNewCommitment,
        recipient_new_commitment: recipientNewCommitment,
        asset_id: assetId,
        
        // Private inputs - Account structs must be individual fields
        sender_account: {
          pubkey: senderAccount.pubkey,
          balance: senderAccount.balance,
          nonce: senderAccount.nonce,
          asset_id: senderAccount.asset_id
        },
        sender_secret_key: senderSecretKey,
        transfer_amount: amount,
        recipient_pubkey: recipient,
        recipient_old_balance: recipientOldBalance,
        recipient_old_nonce: recipientOldNonce,
        sender_new_account: {
          pubkey: senderNewAccount.pubkey,
          balance: senderNewAccount.balance,
          nonce: senderNewAccount.nonce,
          asset_id: senderNewAccount.asset_id
        },
        // Get real merkle proof from tree
        sender_merkle_path: merkleProof.path,
        sender_merkle_indices: merkleProof.indices
      };

      // DETAILED CONSTRAINT VALIDATION LOGGING
      console.log('🔍 CIRCUIT CONSTRAINT ANALYSIS - FIXED VERSION:');
      console.log('='.repeat(60));
      
      // Constraint 1: Identity verification (main.nr:154-155)
      console.log('CONSTRAINT 1 - Identity Verification:');
      console.log('  Circuit code: assert(sender_account.pubkey == pedersen_hash([sender_secret_key]));');
      console.log('  Input pubkey:', inputs.sender_account.pubkey);
      console.log('  Input secret:', inputs.sender_secret_key);
      const expectedPubkeyCheck = await hasher.hashSingle(inputs.sender_secret_key);
      console.log('  Expected pubkey from secret:', expectedPubkeyCheck);
      console.log('  ✓ Match:', inputs.sender_account.pubkey === expectedPubkeyCheck);
      
      // Constraint 2: Merkle proof verification (main.nr:159-164)
      console.log('\nCONSTRAINT 2 - Merkle Tree Verification:');
      console.log('  Circuit: verify_merkle_proof(sender_commitment, merkle_root, path, indices)');
      console.log('  Tree root:', inputs.merkle_root);
      console.log('  Sender commitment:', senderCommitment);
      console.log('  Real tree proof: root != commitment:', inputs.merkle_root !== senderCommitment);
      console.log('  Merkle path length:', inputs.sender_merkle_path.length);
      console.log('  Merkle indices length:', inputs.sender_merkle_indices.length);
      console.log('  Non-zero path elements:', inputs.sender_merkle_path.filter(p => p !== "0").length);
      console.log('  Non-zero indices:', inputs.sender_merkle_indices.filter(i => i !== 0).length);
      
      // Constraint 3: Balance sufficiency (main.nr:167-168)
      console.log('\nCONSTRAINT 3 - Balance Verification:');
      console.log('  Circuit: assert(sender_account.balance >= transfer_amount);');
      console.log('  Sender balance:', inputs.sender_account.balance, '(as number:', parseInt(inputs.sender_account.balance), ')');
      console.log('  Transfer amount:', inputs.transfer_amount, '(as number:', parseInt(inputs.transfer_amount), ')');
      console.log('  ✓ Sufficient:', parseInt(inputs.sender_account.balance) >= parseInt(inputs.transfer_amount));
      
      // Constraint 4: Account validity (main.nr:171-172)
      console.log('\nCONSTRAINT 4 - Account Validity:');
      console.log('  Asset ID match:', inputs.sender_account.asset_id, '==', inputs.asset_id, ':', inputs.sender_account.asset_id === inputs.asset_id);
      
      // Data type validation
      console.log('\nDATA TYPE VALIDATION:');
      console.log('  All string inputs (required for Noir Field):');
      console.log('  - Secret key type:', typeof inputs.sender_secret_key);
      console.log('  - Asset ID type:', typeof inputs.asset_id);
      console.log('  - Transfer amount type:', typeof inputs.transfer_amount);
      
      console.log('\n📋 COMPLETE FIXED INPUTS:');
      console.log(JSON.stringify(inputs, null, 2));

      setProgressMessage('Executing circuit and generating proof...');
      
      // Generate proof
      const result = await prover.generateProof(inputs);
      
      console.log('🎉 Proof generated successfully! The circuit constraints were satisfied.');
      
      // Complete progress
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage('Proof generated successfully!');
      setProofResult(result);
      
      // Update account after successful transfer
      const newBalance = (parseFloat(selectedAccount.balance) - parseFloat(amount)).toString();
      const updatedAccount = AccountHelpers.updateAccountAfterTransfer(
        selectedAccount,
        newBalance
      );
      
      // Save updated account to storage and tree
      if (address) {
        AccountStorage.saveAccount(address, updatedAccount);
        
        // Update tree with new account state
        await treeManager.updateAccount(selectedAccount, updatedAccount, address);
        console.log('✅ Account updated in tree after transfer:', {
          oldBalance: selectedAccount.balance,
          newBalance: updatedAccount.balance,
          newNonce: updatedAccount.nonce,
          treeStats: treeManager.getStats()
        });
        
        setSelectedAccount(updatedAccount);
      }
      
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
    setProofResult(null);
    setError('');
    setProgress(0);
    setProgressMessage('');
  };

  const isTransferDisabled = 
    !recipient || 
    !amount || 
    !isConnected || 
    !selectedAccount ||
    isGenerating ||
    isSupported === false ||
    parseFloat(amount) <= 0 ||
    parseFloat(amount) > parseFloat(selectedAccount?.balance || '0');

  return (
    <InkPageLayout columns={2}>
      {/* Left Column: Account Management */}
      <div className="space-y-6">
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

        {/* Account Manager */}
        <AccountManager 
          onAccountSelected={handleAccountSelected}
          treeManager={treeManager}
        />
      </div>

      {/* Right Column: Transfer Interface & Tree Viewer */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <Card size="default" className="p-4">
          <div className="flex gap-4">
            <Button 
              variant={activeTab === 'transfer' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('transfer')}
            >
              Transfer Interface
            </Button>
            <Button 
              variant={activeTab === 'tree' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('tree')}
            >
              Merkle Tree Viewer
            </Button>
          </div>
        </Card>
        
        {activeTab === 'tree' && (
          <TreeViewer treeManager={treeManager} />
        )}
        
        {activeTab === 'transfer' && (
          <div className="space-y-6">
        {/* Account Selection Status */}
        {selectedAccount ? (
          <Card variant="light-purple" className="p-4">
            <Typography variant="h4" className="mb-2">Selected Account</Typography>
            <Typography variant="body-2-regular">
              Balance: {parseFloat(selectedAccount.balance).toLocaleString()} DAI
            </Typography>
            <Typography variant="caption-2-regular" className="ink:text-muted">
              {selectedAccount.pubkey.slice(0, 10)}...{selectedAccount.pubkey.slice(-4)}
            </Typography>
          </Card>
        ) : (
          <Alert
            variant="warning"
            title="No Account Selected"
            description="Please create and select an account to make transfers"
          />
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
                disabled={!isConnected || isGenerating || !selectedAccount}
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
                disabled={!isConnected || isGenerating || !selectedAccount}
              />
              {amount && selectedAccount && parseFloat(amount) > parseFloat(selectedAccount.balance) && (
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
               !selectedAccount ? 'Select Account First' : 
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
          title="Demo Mode with Real Multi-User Merkle Tree"
          description="Now uses real Merkle tree with multi-user support! Each account gets unique proof paths. Switch to Tree Viewer tab to see the full tree structure."
          variant="info"
        />
          </div>
        )}
      </div>
    </InkPageLayout>
  );
}