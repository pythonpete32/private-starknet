'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Alert } from '@inkonchain/ink-kit';
import { useWalletContext } from '@/app/providers';
import { AccountStorage, PrivateAccount } from '@/lib/accountStorage';

export default function SimpleTestPage() {
  const { isConnected, address, connect } = useWalletContext();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;
  const [accounts, setAccounts] = useState<PrivateAccount[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  
  // Load accounts when wallet connects
  useEffect(() => {
    if (address) {
      loadAccounts();
    }
  }, [address]);
  
  const loadAccounts = () => {
    if (!address) return;
    const loaded = AccountStorage.listAccounts(address);
    setAccounts(loaded);
  };
  
  // Simple account creation without PedersenHasher
  const createTestAccount = async () => {
    if (!address) {
      setTestResult('❌ No wallet connected');
      return;
    }
    
    try {
      // Create a simple test account
      const newAccount: PrivateAccount = {
        secretKey: AccountStorage.generateSecretKey(),
        pubkey: 'test_pubkey_' + Date.now(), // Simple test pubkey
        balance: '1000',
        nonce: '0',
        asset_id: '1',
        created: Date.now()
      };
      
      // Save it
      AccountStorage.saveAccount(address, newAccount);
      
      // Reload accounts
      loadAccounts();
      
      setTestResult('✅ Account created successfully!');
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };
  
  const testPersistence = () => {
    if (!address) {
      setTestResult('❌ No wallet connected');
      return;
    }
    
    // Check localStorage directly
    const keys = Object.keys(localStorage).filter(k => k.includes('privateAccount'));
    
    setTestResult(`
      LocalStorage Keys: ${keys.length} found
      Keys: ${keys.join(', ')}
      Accounts loaded: ${accounts.length}
    `);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Typography variant="h1">Simple Account Test</Typography>
      
      {/* Wallet Status */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Wallet Status</Typography>
        <div className="space-y-2">
          <Typography variant="body-2-regular">
            Connected: {isConnected ? '✅ Yes' : '❌ No'}
          </Typography>
          <Typography variant="body-2-regular">
            Address: {shortAddress || 'Not connected'}
          </Typography>
          <Typography variant="body-2-regular">
            Full Address: {address || 'Not connected'}
          </Typography>
        </div>
        {!isConnected && (
          <Button onClick={connect} variant="primary" className="mt-4">
            Connect Wallet
          </Button>
        )}
      </Card>
      
      {/* Test Actions */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">Test Actions</Typography>
        <div className="space-y-4">
          <Button 
            onClick={createTestAccount} 
            variant="primary"
            disabled={!isConnected}
          >
            Create Test Account (No Pedersen Hash)
          </Button>
          
          <Button 
            onClick={testPersistence} 
            variant="secondary"
          >
            Check localStorage
          </Button>
          
          <Button 
            onClick={loadAccounts} 
            variant="secondary"
            disabled={!isConnected}
          >
            Reload Accounts
          </Button>
        </div>
      </Card>
      
      {/* Test Result */}
      {testResult && (
        <Alert
          variant={testResult.includes('✅') ? 'success' : 'error'}
          title="Test Result"
          description={testResult}
        />
      )}
      
      {/* Accounts List */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Accounts ({accounts.length})
        </Typography>
        {accounts.length === 0 ? (
          <Typography variant="body-2-regular">No accounts found</Typography>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => (
              <Card key={index} variant="secondary" size="small" className="p-3">
                <Typography variant="caption-1-bold">Account {index + 1}</Typography>
                <Typography variant="caption-2-regular">
                  Secret: {account.secretKey.slice(0, 10)}...
                </Typography>
                <Typography variant="caption-2-regular">
                  Balance: {account.balance} DAI
                </Typography>
              </Card>
            ))}
          </div>
        )}
      </Card>
      
      {/* Instructions */}
      <Card variant="light-purple" className="p-6">
        <Typography variant="h4" className="mb-4">Testing Steps</Typography>
        <div className="space-y-2">
          <Typography variant="body-2-regular">
            1. Connect wallet → Should show ✅ Connected
          </Typography>
          <Typography variant="body-2-regular">
            2. Create Test Account → Should show success
          </Typography>
          <Typography variant="body-2-regular">
            3. Check localStorage → Should show keys
          </Typography>
          <Typography variant="body-2-regular">
            4. Refresh page (F5) → Accounts should persist
          </Typography>
        </div>
      </Card>
    </div>
  );
}