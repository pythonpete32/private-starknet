// Simple test to show account persistence works
import { AccountStorage } from '../lib/accountStorage';
import { AccountHelpers } from '../lib/accountHelpers';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() { return Object.keys(store).length; }
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test function
export async function testAccountPersistence() {
  console.log('🧪 TESTING ACCOUNT PERSISTENCE');
  
  const fakeWalletAddress = '0x1234567890abcdef';
  
  // Test 1: Create account
  console.log('\n1. Creating new account...');
  const newAccount = await AccountHelpers.createAccount('1');
  console.log('Generated account:', {
    secretKey: newAccount.secretKey.slice(0, 10) + '...',
    pubkey: newAccount.pubkey.slice(0, 10) + '...',
    balance: newAccount.balance
  });
  
  // Test 2: Save account
  console.log('\n2. Saving account to storage...');
  AccountStorage.saveAccount(fakeWalletAddress, newAccount);
  
  // Test 3: List accounts (should find 1)
  console.log('\n3. Loading accounts from storage...');
  const loadedAccounts = AccountStorage.listAccounts(fakeWalletAddress);
  console.log('Found accounts:', loadedAccounts.length);
  
  // Test 4: Verify account data matches
  if (loadedAccounts.length > 0) {
    const loaded = loadedAccounts[0];
    console.log('\n4. Verifying data matches...');
    console.log('✓ Secret key match:', loaded.secretKey === newAccount.secretKey);
    console.log('✓ Pubkey match:', loaded.pubkey === newAccount.pubkey);
    console.log('✓ Balance match:', loaded.balance === newAccount.balance);
  }
  
  // Test 5: Show what's actually in localStorage
  console.log('\n5. Raw localStorage data:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes('privateAccount')) {
      console.log(`Key: ${key}`);
      console.log(`Value: ${localStorage.getItem(key)?.slice(0, 100)}...`);
    }
  }
  
  console.log('\n✅ Account persistence test complete!');
  return loadedAccounts.length === 1;
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testAccountPersistence().then(success => {
    console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
  });
}