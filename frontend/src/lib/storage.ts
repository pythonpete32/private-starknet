import type { PrivateAccountState } from './types';

export class LocalStateManager {
  private static readonly STORAGE_KEY = 'private_accounts_v1';
  private static readonly COMMITMENT_STORAGE_KEY = 'commitment_utxos_v1';

  // Account System Storage (persistent accounts)
  static getAccountState(): PrivateAccountState | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to read account state from localStorage:', error);
      return null;
    }
  }

  static setAccountState(state: PrivateAccountState): void {
    if (typeof window === 'undefined') return;
    
    try {
      state.lastUpdate = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save account state to localStorage:', error);
    }
  }

  static initializeEmptyAccountState(): PrivateAccountState {
    const empty: PrivateAccountState = {
      version: 1,
      accounts: [],
      merkleRoot: '0',
      merkleLeaves: [],
      lastUpdate: Date.now()
    };
    this.setAccountState(empty);
    return empty;
  }

  // Commitment System Storage (UTXO-style commitments)
  static getCommitmentState(): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.COMMITMENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        commitments: [],
        spentNullifiers: [],
        merkleTree: [],
        lastUpdate: Date.now()
      };
    } catch (error) {
      console.error('Failed to read commitment state from localStorage:', error);
      return null;
    }
  }

  static setCommitmentState(state: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      state.lastUpdate = Date.now();
      localStorage.setItem(this.COMMITMENT_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save commitment state to localStorage:', error);
    }
  }

  // Utility methods
  static clearAllData(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.COMMITMENT_STORAGE_KEY);
      console.log('All private data cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  static exportData(): string {
    if (typeof window === 'undefined') return '';
    
    try {
      const accountState = this.getAccountState();
      const commitmentState = this.getCommitmentState();
      
      return JSON.stringify({
        account: accountState,
        commitment: commitmentState,
        exportDate: new Date().toISOString()
      }, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '';
    }
  }

  static importData(jsonData: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const data = JSON.parse(jsonData);
      
      if (data.account) {
        this.setAccountState(data.account);
      }
      
      if (data.commitment) {
        this.setCommitmentState(data.commitment);
      }
      
      console.log('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Helper method to get storage usage info
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      // LocalStorage limit is typically 5MB (5 * 1024 * 1024 bytes)
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;

      return {
        used,
        available,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error('Failed to calculate storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}