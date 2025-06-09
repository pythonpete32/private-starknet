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
  
  /**
   * Generate cryptographically secure secret key compatible with BN254 field
   * 
   * CRITICAL: Secret keys must be < BN254 field modulus for Noir circuits
   * SECURITY: Uses crypto.getRandomValues() for cryptographic randomness
   * COMPATIBILITY: Generated keys work with Pedersen hash circuits
   * 
   * @returns 64-character hex string (256 bits) within BN254 field bounds
   */
  static generateSecretKey(): string {
    // BN254 field modulus - all secret keys must be smaller than this value
    // This is the order of the elliptic curve used by Noir/zk-SNARKs
    const FIELD_MODULUS = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    
    let secretKey: BigInt;
    do {
      // STEP 1: Generate 32 random bytes using crypto API
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      
      // STEP 2: Convert bytes to hex string then to BigInt
      const hexString = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      secretKey = BigInt('0x' + hexString);
      
      // STEP 3: Retry if >= field modulus (happens ~6% of the time)
      // This ensures uniform distribution within valid field range
    } while (secretKey >= FIELD_MODULUS);
    
    // STEP 4: Convert back to hex string (without 0x prefix)
    // Pad to 64 characters (32 bytes) for consistent format
    return secretKey.toString(16).padStart(64, '0');
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