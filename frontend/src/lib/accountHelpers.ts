import { AccountStorage, PrivateAccount } from './accountStorage';
// Use direct imports to avoid circular dependency issues
import { PedersenHasher } from '@/lib/circuits';

export class AccountHelpers {
  private static pedersenHasher: PedersenHasher | null = null;
  
  private static async getPedersenHasher(): Promise<PedersenHasher> {
    if (!this.pedersenHasher) {
      this.pedersenHasher = new PedersenHasher();
      await this.pedersenHasher.initialize();
    }
    return this.pedersenHasher;
  }

  // Step 2.1: Create new account
  static async createAccount(assetId: string = "1"): Promise<PrivateAccount> {
    const secretKey = AccountStorage.generateSecretKey();
    
    // Step 2.2: Derive pubkey from secretKey (use actual pedersen hash)
    const hasher = await this.getPedersenHasher();
    const pubkey = await hasher.hashSingle(secretKey);
    
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
  static async calculateCommitment(account: PrivateAccount): Promise<string> {
    const hasher = await this.getPedersenHasher();
    return await hasher.hashQuadruple(
      account.pubkey,
      account.balance,
      account.nonce,
      account.asset_id
    );
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

  // Calculate nullifier for account
  static async calculateNullifier(account: PrivateAccount): Promise<string> {
    const commitment = await this.calculateCommitment(account);
    const hasher = await this.getPedersenHasher();
    return await hasher.hashDouble(commitment, account.secretKey);
  }

  // Helper to validate account structure
  static validateAccount(account: PrivateAccount): boolean {
    return (
      typeof account.secretKey === 'string' &&
      typeof account.pubkey === 'string' &&
      typeof account.balance === 'string' &&
      typeof account.nonce === 'string' &&
      typeof account.asset_id === 'string' &&
      typeof account.created === 'number' &&
      account.secretKey.length === 64 && // 32 bytes = 64 hex chars
      !isNaN(Number(account.balance)) &&
      !isNaN(Number(account.nonce))
    );
  }
}