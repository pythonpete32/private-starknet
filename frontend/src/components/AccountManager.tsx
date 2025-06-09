'use client';

import React, { useState, useEffect } from 'react';
import { AccountStorage, PrivateAccount } from '@/lib/accountStorage';
import { AccountHelpers } from '@/lib/accountHelpers';
import { DemoMerkleTreeManager } from '@/lib/treeManager';
import { useWalletContext } from '@/app/providers';
import { Button, Card, Typography, Alert, Modal } from '@inkonchain/ink-kit';

interface AccountManagerProps {
  onAccountSelected?: (account: PrivateAccount | null) => void;
  treeManager?: DemoMerkleTreeManager;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ onAccountSelected, treeManager }) => {
  const { address: walletAddress } = useWalletContext();
  const [accounts, setAccounts] = useState<PrivateAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PrivateAccount | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Step 3.1: Load accounts on mount
  useEffect(() => {
    if (walletAddress) {
      loadAccounts();
    }
  }, [walletAddress]);

  const loadAccounts = () => {
    if (!walletAddress) return;
    
    const loadedAccounts = AccountStorage.listAccounts(walletAddress);
    setAccounts(loadedAccounts);
    
    // Auto-select first account if none selected
    if (loadedAccounts.length > 0 && !selectedAccount) {
      const firstAccount = loadedAccounts[0];
      setSelectedAccount(firstAccount);
      onAccountSelected?.(firstAccount);
    } else if (selectedAccount) {
      // Update selected account if it was modified
      const updatedSelected = loadedAccounts.find(a => a.pubkey === selectedAccount.pubkey);
      if (updatedSelected) {
        setSelectedAccount(updatedSelected);
        onAccountSelected?.(updatedSelected);
      }
    }
  };

  // Notify parent when account selection changes
  const handleAccountSelect = (account: PrivateAccount) => {
    setSelectedAccount(account);
    onAccountSelected?.(account);
  };
  
  // Step 3.2: Create new account (with tree integration)
  const handleCreateAccount = async () => {
    if (!walletAddress) return;
    
    setIsCreatingAccount(true);
    try {
      const newAccount = await AccountHelpers.createAccount("1");
      AccountStorage.saveAccount(walletAddress, newAccount);
      
      // Add to tree if available
      if (treeManager) {
        await treeManager.addAccount(newAccount, walletAddress);
        console.log('✅ Account added to tree:', {
          pubkey: newAccount.pubkey.slice(0, 10) + '...',
          balance: newAccount.balance,
          treeStats: treeManager.getStats()
        });
      }
      
      loadAccounts();
      handleAccountSelect(newAccount);
    } catch (error) {
      console.error('Failed to create account:', error);
    } finally {
      setIsCreatingAccount(false);
    }
  };
  
  // Step 3.3: Delete account (with tree integration)
  const handleDeleteAccount = async (pubkey: string) => {
    if (!walletAddress) return;
    
    try {
      // Find the account to delete
      const accountToDelete = accounts.find(a => a.pubkey === pubkey);
      
      // Remove from storage
      AccountStorage.deleteAccount(walletAddress, pubkey);
      
      // Remove from tree if available
      if (treeManager && accountToDelete) {
        await treeManager.removeAccount(accountToDelete);
        console.log('✅ Account removed from tree:', {
          pubkey: accountToDelete.pubkey.slice(0, 10) + '...',
          remainingStats: treeManager.getStats()
        });
      }
      
      loadAccounts();
      
      if (selectedAccount?.pubkey === pubkey) {
        const remainingAccounts = AccountStorage.listAccounts(walletAddress);
        const newSelected = remainingAccounts[0] || null;
        setSelectedAccount(newSelected);
        onAccountSelected?.(newSelected);
      }
      
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Failed to delete account:', error);
      setShowDeleteModal(null);
    }
  };

  // Format balance for display
  const formatBalance = (balance: string): string => {
    try {
      const balanceNum = Number(balance);
      return balanceNum.toLocaleString();
    } catch {
      return balance;
    }
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!walletAddress) {
    return (
      <Card variant="default" className="p-6">
        <Typography variant="h3" className="mb-4">Account Manager</Typography>
        <Alert 
          variant="warning"
          title="Wallet Required"
          description="Please connect your Starknet wallet to manage private accounts"
        />
        <Card variant="secondary" size="small" className="mt-4 p-3">
          <Typography variant="caption-2-regular">
            Debug: walletAddress = {walletAddress || 'null/undefined'}
          </Typography>
        </Card>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h2">Private Accounts</Typography>
          <Typography variant="body-2-regular" className="mt-1">
            Manage your zero-knowledge private accounts
          </Typography>
        </div>
        <Button 
          onClick={handleCreateAccount}
          variant="primary"
          disabled={isCreatingAccount}
        >
          {isCreatingAccount ? 'Creating...' : 'Create New Account'}
        </Button>
      </div>

      {/* Account List */}
      <Card variant="default" className="p-6">
        <Typography variant="h3" className="mb-4">
          Your Accounts ({accounts.length})
        </Typography>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body-1" className="mb-4">
              No private accounts found
            </Typography>
            <Typography variant="body-2-regular">
              Create your first account to start making private transfers
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => (
              <Card
                key={account.pubkey}
                variant={selectedAccount?.pubkey === account.pubkey ? "light-purple" : "secondary"}
                clickable
                className={`p-4 transition-all ${
                  selectedAccount?.pubkey === account.pubkey ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleAccountSelect(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Typography variant="body-2-bold">
                        Account {index + 1}
                      </Typography>
                      {selectedAccount?.pubkey === account.pubkey && (
                        <div className="px-2 py-1 ink:bg-status-success-bg ink:text-status-success rounded text-xs">
                          Selected
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Typography variant="caption-1-regular">
                        Balance: {formatBalance(account.balance)} DAI
                      </Typography>
                      <Typography variant="caption-2-regular" className="ink:text-muted">
                        {formatAddress(account.pubkey)}
                      </Typography>
                      <Typography variant="caption-2-regular" className="ink:text-muted">
                        Created: {new Date(account.created).toLocaleDateString()}
                      </Typography>
                    </div>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(account.pubkey);
                    }}
                    variant="transparent"
                    size="md"
                    className="ink:text-status-error"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Selected Account Details */}
      {selectedAccount && (
        <Card variant="default" className="p-6">
          <Typography variant="h3" className="mb-4">Selected Account Details</Typography>
          <div className="space-y-3">
            <div>
              <Typography variant="caption-1-bold" className="mb-1">Public Key</Typography>
              <Typography variant="caption-2-regular" className="break-all ink:text-muted">
                {selectedAccount.pubkey}
              </Typography>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="caption-1-bold" className="mb-1">Balance</Typography>
                <Typography variant="body-2-regular">
                  {formatBalance(selectedAccount.balance)} DAI
                </Typography>
              </div>
              <div>
                <Typography variant="caption-1-bold" className="mb-1">Nonce</Typography>
                <Typography variant="body-2-regular">
                  {selectedAccount.nonce}
                </Typography>
              </div>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="mb-1">Asset ID</Typography>
              <Typography variant="body-2-regular">
                {selectedAccount.asset_id} (DAI)
              </Typography>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          id="delete-account-modal"
          title="Delete Account"
          size="md"
          onClose={() => setShowDeleteModal(null)}
        >
          <div className="space-y-4">
            <Typography variant="body-1">
              Are you sure you want to delete this account? This action cannot be undone.
            </Typography>
            <Alert
              variant="warning"
              title="Warning"
              description="Any remaining balance in this account will be lost forever"
            />
            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={() => handleDeleteAccount(showDeleteModal)}
                className="ink:bg-status-error-bg ink:text-status-error"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};