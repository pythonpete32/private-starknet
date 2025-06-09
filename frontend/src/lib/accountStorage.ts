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