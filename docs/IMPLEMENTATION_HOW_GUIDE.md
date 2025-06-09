# Implementation HOW Guide - Phase 3 Priorities

**Purpose**: Detailed step-by-step implementation plan for Priority 1 & 2

## 🎯 **Priority 1: Account Persistence - DETAILED HOW**

### **Step 1: Create AccountStorage Module (Day 1)**

```typescript
// File: src/lib/accountStorage.ts

export interface PrivateAccount {
  secretKey: string;        // 32-byte hex string
  pubkey: string;          // Derived from secretKey  
  balance: string;         // BigInt as string
  nonce: string;          // BigInt as string
  asset_id: string;       // "1" for DAI
  created: number;        // Date.now()
}

export class AccountStorage {
  private static STORAGE_PREFIX = 'privateAccount_';
  
  // Step 1.1: Secure key generation
  static generateSecretKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Step 1.2: Storage key formatting
  private static getStorageKey(walletAddress: string, accountIndex?: number): string {
    const base = `${this.STORAGE_PREFIX}${walletAddress}`;
    return accountIndex !== undefined ? `${base}_${accountIndex}` : base;
  }
  
  // Step 1.3: Save account
  static saveAccount(walletAddress: string, account: PrivateAccount): void {
    const accounts = this.listAccounts(walletAddress);
    const existingIndex = accounts.findIndex(a => a.pubkey === account.pubkey);
    
    if (existingIndex >= 0) {
      // Update existing
      const key = this.getStorageKey(walletAddress, existingIndex);
      localStorage.setItem(key, JSON.stringify(account));
    } else {
      // Add new
      const newIndex = accounts.length;
      const key = this.getStorageKey(walletAddress, newIndex);
      localStorage.setItem(key, JSON.stringify(account));
    }
  }
  
  // Step 1.4: Load accounts
  static listAccounts(walletAddress: string): PrivateAccount[] {
    const accounts: PrivateAccount[] = [];
    const prefix = this.getStorageKey(walletAddress);
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix + '_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            accounts.push(JSON.parse(data));
          } catch (e) {
            console.warn('Invalid account data:', key);
          }
        }
      }
    }
    
    return accounts.sort((a, b) => a.created - b.created);
  }
  
  // Step 1.5: Delete account
  static deleteAccount(walletAddress: string, pubkey: string): boolean {
    const accounts = this.listAccounts(walletAddress);
    const index = accounts.findIndex(a => a.pubkey === pubkey);
    
    if (index >= 0) {
      const key = this.getStorageKey(walletAddress, index);
      localStorage.removeItem(key);
      
      // Reindex remaining accounts
      this.reindexAccounts(walletAddress);
      return true;
    }
    return false;
  }
  
  // Step 1.6: Helper - reindex after deletion
  private static reindexAccounts(walletAddress: string): void {
    const accounts = this.listAccounts(walletAddress);
    
    // Clear all existing
    const prefix = this.getStorageKey(walletAddress);
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix + '_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Re-save with correct indices
    accounts.forEach((account, index) => {
      const key = this.getStorageKey(walletAddress, index);
      localStorage.setItem(key, JSON.stringify(account));
    });
  }
}
```

### **Step 2: Create Account Creation Helper (Day 1)**

```typescript
// File: src/lib/accountHelpers.ts

import { AccountStorage, PrivateAccount } from './accountStorage';
import { pedersenHash } from './circuits';

export class AccountHelpers {
  // Step 2.1: Create new account
  static createAccount(assetId: string = "1"): PrivateAccount {
    const secretKey = AccountStorage.generateSecretKey();
    
    // Step 2.2: Derive pubkey from secretKey (simplified - use actual derivation)
    const pubkey = pedersenHash([secretKey, "pubkey_salt"]);
    
    return {
      secretKey,
      pubkey,
      balance: "0",
      nonce: "0", 
      asset_id: assetId,
      created: Date.now()
    };
  }
  
  // Step 2.3: Calculate account commitment
  static calculateCommitment(account: PrivateAccount): string {
    return pedersenHash([
      account.pubkey,
      account.balance,
      account.nonce,
      account.asset_id
    ]);
  }
  
  // Step 2.4: Update account after transfer
  static updateAccountAfterTransfer(
    account: PrivateAccount, 
    newBalance: string, 
    incrementNonce: boolean = true
  ): PrivateAccount {
    return {
      ...account,
      balance: newBalance,
      nonce: incrementNonce ? (BigInt(account.nonce) + 1n).toString() : account.nonce
    };
  }
}
```

### **Step 3: Update UI Components (Day 2)**

```typescript
// File: src/components/AccountManager.tsx

import React, { useState, useEffect } from 'react';
import { AccountStorage, PrivateAccount } from '@/lib/accountStorage';
import { AccountHelpers } from '@/lib/accountHelpers';
import { useWallet } from '@/hooks/useWallet';

export const AccountManager: React.FC = () => {
  const { address: walletAddress } = useWallet();
  const [accounts, setAccounts] = useState<PrivateAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PrivateAccount | null>(null);
  
  // Step 3.1: Load accounts on mount
  useEffect(() => {
    if (walletAddress) {
      const loadedAccounts = AccountStorage.listAccounts(walletAddress);
      setAccounts(loadedAccounts);
      
      if (loadedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(loadedAccounts[0]);
      }
    }
  }, [walletAddress]);
  
  // Step 3.2: Create new account
  const handleCreateAccount = () => {
    if (!walletAddress) return;
    
    const newAccount = AccountHelpers.createAccount("1");
    AccountStorage.saveAccount(walletAddress, newAccount);
    
    const updatedAccounts = AccountStorage.listAccounts(walletAddress);
    setAccounts(updatedAccounts);
    setSelectedAccount(newAccount);
  };
  
  // Step 3.3: Delete account
  const handleDeleteAccount = (pubkey: string) => {
    if (!walletAddress) return;
    
    AccountStorage.deleteAccount(walletAddress, pubkey);
    const updatedAccounts = AccountStorage.listAccounts(walletAddress);
    setAccounts(updatedAccounts);
    
    if (selectedAccount?.pubkey === pubkey) {
      setSelectedAccount(updatedAccounts[0] || null);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Account List */}
      <div>
        <h3>Private Accounts ({accounts.length})</h3>
        {accounts.map((account, index) => (
          <div 
            key={account.pubkey}
            className={`p-3 border rounded ${
              selectedAccount?.pubkey === account.pubkey ? 'bg-blue-50' : ''
            }`}
            onClick={() => setSelectedAccount(account)}
          >
            <div>Account {index + 1}</div>
            <div className="text-sm text-gray-600">
              Balance: {account.balance} DAI
            </div>
            <div className="text-xs text-gray-400">
              {account.pubkey.slice(0, 10)}...
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAccount(account.pubkey);
              }}
              className="text-red-500 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      
      {/* Create Account Button */}
      <button 
        onClick={handleCreateAccount}
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        Create New Account
      </button>
      
      {/* Selected Account Details */}
      {selectedAccount && (
        <div className="p-4 bg-gray-50 rounded">
          <h4>Selected Account</h4>
          <div>Public Key: {selectedAccount.pubkey}</div>
          <div>Balance: {selectedAccount.balance}</div>
          <div>Nonce: {selectedAccount.nonce}</div>
          <div>Created: {new Date(selectedAccount.created).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
};
```

### **Step 4: Integration with Proof Generation (Day 3)**

```typescript
// File: src/app/account-system/page.tsx - UPDATE

// Step 4.1: Replace hardcoded account with selected account
const generateProof = async () => {
  if (!selectedAccount) {
    alert('Please select an account first');
    return;
  }
  
  // Use selectedAccount instead of hardcoded data
  const senderAccount = {
    pubkey: selectedAccount.pubkey,
    balance: selectedAccount.balance,
    nonce: selectedAccount.nonce,
    asset_id: selectedAccount.asset_id
  };
  
  const senderSecretKey = selectedAccount.secretKey;
  
  // Rest of proof generation logic...
};

// Step 4.2: Update account after successful transfer
const updateAccountAfterTransfer = (newBalance: string) => {
  if (!selectedAccount || !walletAddress) return;
  
  const updatedAccount = AccountHelpers.updateAccountAfterTransfer(
    selectedAccount,
    newBalance
  );
  
  AccountStorage.saveAccount(walletAddress, updatedAccount);
  // Refresh UI
  loadAccounts();
};
```

---

## 🎯 **Priority 2: Multi-User Merkle Tree - DETAILED HOW**

### **Step 1: Create Tree Data Structures (Day 1)**

```typescript
// File: src/lib/merkleTree.ts

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  data?: any; // Account data for leaf nodes
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
  root: string;
}

export class DemoMerkleTree {
  private root: MerkleNode | null = null;
  private leaves: MerkleNode[] = [];
  private depth: number = 20; // Match circuit depth
  
  // Step 1.1: Add account to tree
  addLeaf(accountCommitment: string, accountData: any): void {
    const newLeaf: MerkleNode = {
      hash: accountCommitment,
      isLeaf: true,
      data: accountData
    };
    
    this.leaves.push(newLeaf);
    this.rebuildTree();
  }
  
  // Step 1.2: Update existing account
  updateLeaf(oldCommitment: string, newCommitment: string, newData: any): boolean {
    const leafIndex = this.leaves.findIndex(leaf => leaf.hash === oldCommitment);
    
    if (leafIndex >= 0) {
      this.leaves[leafIndex] = {
        hash: newCommitment,
        isLeaf: true,
        data: newData
      };
      this.rebuildTree();
      return true;
    }
    return false;
  }
  
  // Step 1.3: Generate merkle proof for account
  generateProof(accountCommitment: string): MerkleProof | null {
    const leafIndex = this.leaves.findIndex(leaf => leaf.hash === accountCommitment);
    
    if (leafIndex < 0) return null;
    
    const path: string[] = [];
    const indices: number[] = [];
    
    // Build proof path from leaf to root
    let currentIndex = leafIndex;
    let currentLevel = this.leaves.slice(); // Start with leaf level
    
    for (let depth = 0; depth < this.depth; depth++) {
      if (currentLevel.length <= 1) {
        // Pad with zeros for remaining depth
        path.push("0");
        indices.push(0);
      } else {
        const isRightChild = currentIndex % 2 === 1;
        const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;
        
        const siblingHash = siblingIndex < currentLevel.length 
          ? this.getNodeHash(currentLevel[siblingIndex])
          : "0";
        
        path.push(siblingHash);
        indices.push(isRightChild ? 1 : 0);
        
        // Move to parent level
        currentIndex = Math.floor(currentIndex / 2);
        currentLevel = this.buildLevel(currentLevel);
      }
    }
    
    return {
      leaf: accountCommitment,
      path,
      indices,
      root: this.getRoot()
    };
  }
  
  // Step 1.4: Get tree root
  getRoot(): string {
    return this.root ? this.getNodeHash(this.root) : "0";
  }
  
  // Step 1.5: Rebuild entire tree
  private rebuildTree(): void {
    if (this.leaves.length === 0) {
      this.root = null;
      return;
    }
    
    let currentLevel = this.leaves.slice();
    
    // Build tree bottom-up
    while (currentLevel.length > 1) {
      currentLevel = this.buildLevel(currentLevel);
    }
    
    this.root = currentLevel[0];
  }
  
  // Step 1.6: Build parent level from children
  private buildLevel(children: MerkleNode[]): MerkleNode[] {
    const parents: MerkleNode[] = [];
    
    for (let i = 0; i < children.length; i += 2) {
      const left = children[i];
      const right = i + 1 < children.length ? children[i + 1] : null;
      
      const parent: MerkleNode = {
        hash: this.hashPair(
          this.getNodeHash(left),
          right ? this.getNodeHash(right) : "0"
        ),
        left,
        right: right || undefined,
        isLeaf: false
      };
      
      parents.push(parent);
    }
    
    return parents;
  }
  
  // Step 1.7: Hash two values
  private hashPair(left: string, right: string): string {
    // Import pedersenHash from circuits
    return pedersenHash([left, right]);
  }
  
  // Step 1.8: Get hash of node
  private getNodeHash(node: MerkleNode): string {
    return node.hash;
  }
}
```

### **Step 2: Create Tree Manager (Day 2)**

```typescript
// File: src/lib/treeManager.ts

import { DemoMerkleTree, MerkleProof } from './merkleTree';
import { PrivateAccount } from './accountStorage';
import { AccountHelpers } from './accountHelpers';

export interface TreeAccount {
  commitment: string;
  account: PrivateAccount;
  walletAddress: string;
}

export class DemoMerkleTreeManager {
  private tree: DemoMerkleTree;
  private accounts: Map<string, TreeAccount> = new Map();
  private static STORAGE_KEY = 'demoMerkleTree';
  
  constructor() {
    this.tree = new DemoMerkleTree();
    this.loadFromStorage();
  }
  
  // Step 2.1: Add account to tree
  addAccount(account: PrivateAccount, walletAddress: string): void {
    const commitment = AccountHelpers.calculateCommitment(account);
    
    const treeAccount: TreeAccount = {
      commitment,
      account,
      walletAddress
    };
    
    this.accounts.set(commitment, treeAccount);
    this.tree.addLeaf(commitment, treeAccount);
    this.saveToStorage();
  }
  
  // Step 2.2: Update account in tree
  updateAccount(oldAccount: PrivateAccount, newAccount: PrivateAccount, walletAddress: string): boolean {
    const oldCommitment = AccountHelpers.calculateCommitment(oldAccount);
    const newCommitment = AccountHelpers.calculateCommitment(newAccount);
    
    if (this.accounts.has(oldCommitment)) {
      // Remove old
      this.accounts.delete(oldCommitment);
      
      // Add new
      const treeAccount: TreeAccount = {
        commitment: newCommitment,
        account: newAccount,
        walletAddress
      };
      
      this.accounts.set(newCommitment, treeAccount);
      
      // Update tree
      const success = this.tree.updateLeaf(oldCommitment, newCommitment, treeAccount);
      
      if (success) {
        this.saveToStorage();
      }
      
      return success;
    }
    
    return false;
  }
  
  // Step 2.3: Generate proof for account
  generateProof(account: PrivateAccount): MerkleProof | null {
    const commitment = AccountHelpers.calculateCommitment(account);
    return this.tree.generateProof(commitment);
  }
  
  // Step 2.4: Get tree root
  getRoot(): string {
    return this.tree.getRoot();
  }
  
  // Step 2.5: Get all accounts
  getAllAccounts(): TreeAccount[] {
    return Array.from(this.accounts.values());
  }
  
  // Step 2.6: Get accounts by wallet
  getAccountsByWallet(walletAddress: string): TreeAccount[] {
    return this.getAllAccounts().filter(ta => ta.walletAddress === walletAddress);
  }
  
  // Step 2.7: Save to localStorage
  private saveToStorage(): void {
    const data = {
      accounts: Array.from(this.accounts.entries()),
      timestamp: Date.now()
    };
    
    localStorage.setItem(DemoMerkleTreeManager.STORAGE_KEY, JSON.stringify(data));
  }
  
  // Step 2.8: Load from localStorage
  private loadFromStorage(): void {
    const data = localStorage.getItem(DemoMerkleTreeManager.STORAGE_KEY);
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.accounts = new Map(parsed.accounts);
        
        // Rebuild tree from loaded accounts
        this.accounts.forEach((treeAccount, commitment) => {
          this.tree.addLeaf(commitment, treeAccount);
        });
        
      } catch (e) {
        console.warn('Failed to load tree from storage:', e);
      }
    }
  }
  
  // Step 2.9: Clear all data (for testing)
  clear(): void {
    this.accounts.clear();
    this.tree = new DemoMerkleTree();
    localStorage.removeItem(DemoMerkleTreeManager.STORAGE_KEY);
  }
}
```

### **Step 3: Integration with UI (Day 3-4)**

```typescript
// File: src/components/TreeViewer.tsx

import React, { useState, useEffect } from 'react';
import { DemoMerkleTreeManager, TreeAccount } from '@/lib/treeManager';

export const TreeViewer: React.FC = () => {
  const [treeManager] = useState(() => new DemoMerkleTreeManager());
  const [accounts, setAccounts] = useState<TreeAccount[]>([]);
  const [treeRoot, setTreeRoot] = useState<string>('');
  
  useEffect(() => {
    refreshTreeData();
  }, []);
  
  const refreshTreeData = () => {
    setAccounts(treeManager.getAllAccounts());
    setTreeRoot(treeManager.getRoot());
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h3>Merkle Tree Status</h3>
        <div>Root: {treeRoot}</div>
        <div>Total Accounts: {accounts.length}</div>
      </div>
      
      <div>
        <h4>Tree Accounts</h4>
        {accounts.map((treeAccount, index) => (
          <div key={treeAccount.commitment} className="p-2 border rounded">
            <div>Account {index + 1}</div>
            <div className="text-sm">
              Wallet: {treeAccount.walletAddress.slice(0, 10)}...
            </div>
            <div className="text-sm">
              Balance: {treeAccount.account.balance}
            </div>
            <div className="text-xs text-gray-400">
              Commitment: {treeAccount.commitment.slice(0, 20)}...
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={refreshTreeData}
        className="p-2 bg-gray-500 text-white rounded"
      >
        Refresh Tree
      </button>
    </div>
  );
};
```

---

## 📋 **INTEGRATION CHECKLIST**

### **Week 1 Deliverables:**
- [ ] AccountStorage class with secure key generation
- [ ] Account persistence across browser refreshes  
- [ ] Multi-account support per wallet
- [ ] AccountManager UI component
- [ ] Integration with existing proof generation

### **Week 2 Deliverables:**
- [ ] DemoMerkleTree with real multi-leaf support
- [ ] DemoMerkleTreeManager for state management
- [ ] Real merkle proof generation (not Array(20).fill("0"))
- [ ] Tree persistence across sessions
- [ ] TreeViewer UI component
- [ ] Full integration: accounts ↔ tree ↔ proofs

### **Testing Scenarios:**
- [ ] Create account → refresh browser → account persists
- [ ] Multiple accounts per wallet work correctly
- [ ] Tree with 2+ accounts generates valid proofs
- [ ] Account updates properly update tree
- [ ] Tree state persists across sessions

This is the detailed HOW for implementing both priorities.