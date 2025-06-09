// Demo Merkle Tree Manager for coordinating accounts with tree state
// This replaces the single-leaf Array(20).fill("0") approach with real multi-user tree management

import { DemoMerkleTree, MerkleProof } from './merkleTree';
import { PrivateAccount } from './accountStorage';
import { AccountHelpers } from './accountHelpers';

export interface TreeAccount {
  commitment: string;
  account: PrivateAccount;
  walletAddress: string;
  addedAt: number;
}

export class DemoMerkleTreeManager {
  private tree: DemoMerkleTree;
  private accounts: Map<string, TreeAccount> = new Map();
  private static STORAGE_KEY = 'demoMerkleTree';
  private initialized: boolean = false;
  
  constructor() {
    this.tree = new DemoMerkleTree();
  }
  
  // Initialize tree manager
  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.tree.initialize();
      await this.loadFromStorage();
      this.initialized = true;
    }
  }
  
  // Add account to tree
  async addAccount(account: PrivateAccount, walletAddress: string): Promise<void> {
    await this.initialize();
    
    const commitment = await AccountHelpers.calculateCommitment(account);
    
    // Check if account already exists
    if (this.accounts.has(commitment)) {
      console.log('Account already exists in tree:', commitment);
      return;
    }
    
    const treeAccount: TreeAccount = {
      commitment,
      account,
      walletAddress,
      addedAt: Date.now()
    };
    
    this.accounts.set(commitment, treeAccount);
    await this.tree.addLeaf(commitment, treeAccount);
    await this.saveToStorage();
    
    console.log('Added account to tree:', {
      commitment: commitment.slice(0, 10) + '...',
      walletAddress: walletAddress.slice(0, 10) + '...',
      treeRoot: this.tree.getRoot().slice(0, 10) + '...',
      totalAccounts: this.accounts.size
    });
  }
  
  // Update account in tree
  async updateAccount(oldAccount: PrivateAccount, newAccount: PrivateAccount, walletAddress: string): Promise<boolean> {
    await this.initialize();
    
    const oldCommitment = await AccountHelpers.calculateCommitment(oldAccount);
    const newCommitment = await AccountHelpers.calculateCommitment(newAccount);
    
    if (this.accounts.has(oldCommitment)) {
      // Remove old
      this.accounts.delete(oldCommitment);
      
      // Add new
      const treeAccount: TreeAccount = {
        commitment: newCommitment,
        account: newAccount,
        walletAddress,
        addedAt: Date.now()
      };
      
      this.accounts.set(newCommitment, treeAccount);
      
      // Update tree
      const success = await this.tree.updateLeaf(oldCommitment, newCommitment, treeAccount);
      
      if (success) {
        await this.saveToStorage();
        console.log('Updated account in tree:', {
          oldCommitment: oldCommitment.slice(0, 10) + '...',
          newCommitment: newCommitment.slice(0, 10) + '...',
          newBalance: newAccount.balance,
          newNonce: newAccount.nonce
        });
      }
      
      return success;
    }
    
    return false;
  }
  
  // Remove account from tree (rebuild required)
  async removeAccount(account: PrivateAccount): Promise<boolean> {
    await this.initialize();
    
    const commitment = await AccountHelpers.calculateCommitment(account);
    
    if (this.accounts.has(commitment)) {
      this.accounts.delete(commitment);
      
      // Rebuild tree without this account
      await this.rebuildTreeFromAccounts();
      await this.saveToStorage();
      
      console.log('Removed account from tree:', {
        commitment: commitment.slice(0, 10) + '...',
        remainingAccounts: this.accounts.size
      });
      
      return true;
    }
    
    return false;
  }
  
  // Generate proof for account
  async generateProof(account: PrivateAccount): Promise<MerkleProof | null> {
    await this.initialize();
    
    const commitment = await AccountHelpers.calculateCommitment(account);
    const proof = await this.tree.generateProof(commitment);
    
    if (proof) {
      console.log('Generated merkle proof:', {
        leaf: commitment.slice(0, 10) + '...',
        root: proof.root.slice(0, 10) + '...',
        pathLength: proof.path.length,
        indicesLength: proof.indices.length,
        treeSize: this.accounts.size
      });
    } else {
      console.warn('Failed to generate proof for account:', commitment.slice(0, 10) + '...');
    }
    
    return proof;
  }
  
  // Check if account exists in tree
  async hasAccount(account: PrivateAccount): Promise<boolean> {
    await this.initialize();
    
    const commitment = await AccountHelpers.calculateCommitment(account);
    return this.accounts.has(commitment);
  }
  
  // Get tree root
  getRoot(): string {
    return this.tree.getRoot();
  }
  
  // Get tree statistics
  getStats(): { totalAccounts: number; treeRoot: string; leafCount: number } {
    return {
      totalAccounts: this.accounts.size,
      treeRoot: this.tree.getRoot(),
      leafCount: this.tree.getLeafCount()
    };
  }
  
  // Get all accounts
  getAllAccounts(): TreeAccount[] {
    return Array.from(this.accounts.values()).sort((a, b) => a.addedAt - b.addedAt);
  }
  
  // Get accounts by wallet
  getAccountsByWallet(walletAddress: string): TreeAccount[] {
    return this.getAllAccounts().filter(ta => ta.walletAddress === walletAddress);
  }
  
  // Get account by commitment
  getAccountByCommitment(commitment: string): TreeAccount | undefined {
    return this.accounts.get(commitment);
  }
  
  // Rebuild tree from current accounts
  private async rebuildTreeFromAccounts(): Promise<void> {
    this.tree.clear();
    
    for (const [commitment, treeAccount] of this.accounts) {
      await this.tree.addLeaf(commitment, treeAccount);
    }
  }
  
  // Save to localStorage
  private async saveToStorage(): Promise<void> {
    const data = {
      accounts: Array.from(this.accounts.entries()),
      treeState: this.tree.exportState(),
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(DemoMerkleTreeManager.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save tree to storage:', error);
    }
  }
  
  // Load from localStorage
  private async loadFromStorage(): Promise<void> {
    const data = localStorage.getItem(DemoMerkleTreeManager.STORAGE_KEY);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        
        // Restore accounts map
        this.accounts = new Map(parsed.accounts || []);
        
        // Restore tree state
        if (parsed.treeState) {
          await this.tree.importState(parsed.treeState);
        } else {
          // Legacy: rebuild tree from accounts
          await this.rebuildTreeFromAccounts();
        }
        
        console.log('Loaded tree from storage:', {
          totalAccounts: this.accounts.size,
          treeRoot: this.tree.getRoot().slice(0, 10) + '...',
          timestamp: new Date(parsed.timestamp).toLocaleString()
        });
        
      } catch (error) {
        console.error('Failed to load tree from storage:', error);
        // Reset to clean state on error
        this.clear();
      }
    }
  }
  
  // Clear all data (for testing)
  async clear(): Promise<void> {
    this.accounts.clear();
    this.tree.clear();
    localStorage.removeItem(DemoMerkleTreeManager.STORAGE_KEY);
    console.log('Cleared all tree data');
  }
  
  // Export tree data for debugging
  exportDebugData(): any {
    return {
      accounts: Array.from(this.accounts.entries()),
      treeStats: this.getStats(),
      allLeaves: this.tree.getAllLeaves(),
      timestamp: Date.now()
    };
  }
  
  // Verify tree integrity
  async verifyIntegrity(): Promise<boolean> {
    await this.initialize();
    
    // Check that all account commitments match tree leaves
    const accountCommitments = Array.from(this.accounts.keys()).sort();
    const treeLeaves = this.tree.getAllLeaves().sort();
    
    if (accountCommitments.length !== treeLeaves.length) {
      console.error('Tree integrity error: account count mismatch');
      return false;
    }
    
    for (let i = 0; i < accountCommitments.length; i++) {
      if (accountCommitments[i] !== treeLeaves[i]) {
        console.error('Tree integrity error: commitment mismatch at index', i);
        return false;
      }
    }
    
    console.log('Tree integrity verified:', {
      accountCount: accountCommitments.length,
      root: this.getRoot().slice(0, 10) + '...'
    });
    
    return true;
  }
}