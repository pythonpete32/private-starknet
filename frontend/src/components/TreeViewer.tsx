import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Alert } from '@inkonchain/ink-kit';
import { DemoMerkleTreeManager, TreeAccount } from '@/lib/treeManager';

interface TreeViewerProps {
  treeManager: DemoMerkleTreeManager;
  onRefresh?: () => void;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ treeManager, onRefresh }) => {
  const [accounts, setAccounts] = useState<TreeAccount[]>([]);
  const [stats, setStats] = useState<{ totalAccounts: number; treeRoot: string; leafCount: number }>({
    totalAccounts: 0,
    treeRoot: '0',
    leafCount: 0
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<boolean | null>(null);
  
  useEffect(() => {
    refreshTreeData();
  }, [treeManager]);
  
  const refreshTreeData = async () => {
    try {
      await treeManager.initialize();
      const allAccounts = treeManager.getAllAccounts();
      const treeStats = treeManager.getStats();
      
      setAccounts(allAccounts);
      setStats(treeStats);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to refresh tree data:', error);
    }
  };
  
  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    setIntegrityResult(null);
    
    try {
      const isValid = await treeManager.verifyIntegrity();
      setIntegrityResult(isValid);
    } catch (error) {
      console.error('Integrity verification failed:', error);
      setIntegrityResult(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleClearTree = async () => {
    if (confirm('Are you sure you want to clear all tree data? This action cannot be undone.')) {
      await treeManager.clear();
      await refreshTreeData();
      setIntegrityResult(null);
    }
  };
  
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const formatHash = (hash: string): string => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };
  
  return (
    <div className="space-y-6">
      {/* Tree Statistics */}
      <Card variant="light-purple" size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">Merkle Tree Status</Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Total Accounts
              </Typography>
              <Typography variant="h3">
                {stats.totalAccounts}
              </Typography>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Tree Leaves
              </Typography>
              <Typography variant="h3">
                {stats.leafCount}
              </Typography>
            </div>
            <div>
              <Typography variant="caption-1-bold" className="ink:text-muted">
                Tree Root
              </Typography>
              <Typography variant="body-2-regular" className="font-mono">
                {stats.treeRoot === '0' ? 'Empty' : formatHash(stats.treeRoot)}
              </Typography>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Tree Integrity */}
      <Card size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">Tree Integrity</Typography>
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify Integrity'}
            </Button>
            <Button 
              variant="secondary"
              onClick={refreshTreeData}
            >
              Refresh Data
            </Button>
            <Button 
              variant="secondary"
              onClick={handleClearTree}
              disabled={stats.totalAccounts === 0}
            >
              Clear Tree
            </Button>
          </div>
          
          {integrityResult !== null && (
            <Alert
              variant={integrityResult ? 'success' : 'error'}
              title={integrityResult ? 'Tree Valid' : 'Tree Integrity Error'}
              description={
                integrityResult 
                  ? 'All account commitments match tree leaves. Tree structure is valid.'
                  : 'Tree integrity check failed. There may be a mismatch between accounts and tree leaves.'
              }
            />
          )}
        </div>
      </Card>
      
      {/* Tree Accounts */}
      <Card size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">Tree Accounts ({accounts.length})</Typography>
          
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <Typography variant="body-2-regular" className="ink:text-muted">
                No accounts in tree yet. Create an account to see it appear here.
              </Typography>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((treeAccount, index) => (
                <Card 
                  key={treeAccount.commitment} 
                  variant="secondary" 
                  size="small" 
                  className="p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Typography variant="body-2-regular">
                        <strong>Account {index + 1}</strong>
                      </Typography>
                      <div className="space-y-1">
                        <Typography variant="caption-2-regular" className="ink:text-muted">
                          Wallet: {formatAddress(treeAccount.walletAddress)}
                        </Typography>
                        <Typography variant="caption-2-regular" className="ink:text-muted">
                          Balance: {parseFloat(treeAccount.account.balance).toLocaleString()} DAI
                        </Typography>
                        <Typography variant="caption-2-regular" className="ink:text-muted">
                          Nonce: {treeAccount.account.nonce}
                        </Typography>
                        <Typography variant="caption-2-regular" className="ink:text-muted font-mono">
                          Commitment: {formatHash(treeAccount.commitment)}
                        </Typography>
                        <Typography variant="caption-2-regular" className="ink:text-muted">
                          Added: {new Date(treeAccount.addedAt).toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                    <div className="text-right">
                      <Typography variant="caption-1-bold" className="ink:text-muted">
                        Leaf #{index}
                      </Typography>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
      
      {/* How It Works */}
      <Card variant="light-purple" size="default" className="p-6">
        <div className="space-y-4">
          <Typography variant="h4">How Multi-User Tree Works</Typography>
          <div className="space-y-2">
            <Typography variant="body-2-regular">
              • <strong>Real Merkle Proofs:</strong> Each account gets a unique proof path to the tree root
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Multi-User Support:</strong> Multiple wallets can have accounts in the same tree
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Persistent State:</strong> Tree structure survives browser refresh and maintains integrity
            </Typography>
            <Typography variant="body-2-regular">
              • <strong>Circuit Compatible:</strong> Generates 20-depth proofs matching circuit requirements
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
};