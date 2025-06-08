import { describe, test, expect } from 'bun:test';
import { 
  AccountSystem, 
  AccountMerkleTree, 
  TransferSystem,
  generateTestAccounts,
  toField, 
  pedersenHash,
  type Account,
  type Field
} from './account-system';

describe('Field Utilities', () => {
  test('toField converts numbers correctly', () => {
    expect(toField(100)).toBe('0x0000000000000000000000000000000000000000000000000000000000000064');
    expect(toField(0)).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
    expect(toField(1000)).toBe('0x00000000000000000000000000000000000000000000000000000000000003e8');
  });

  test('toField handles hex strings', () => {
    expect(toField('0x1234567890')).toBe('0x0000000000000000000000000000000000000000000000000000001234567890');
    expect(toField('0xABCDEF')).toBe('0x0000000000000000000000000000000000000000000000000000000000abcdef');
  });

  test('pedersenHash is deterministic', () => {
    const field1 = toField(100);
    const field2 = toField(200);
    
    const hash1 = pedersenHash([field1, field2]);
    const hash2 = pedersenHash([field1, field2]);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('pedersenHash is order-sensitive', () => {
    const field1 = toField(100);
    const field2 = toField(200);
    
    const hash1 = pedersenHash([field1, field2]);
    const hash2 = pedersenHash([field2, field1]);
    
    expect(hash1).not.toBe(hash2);
  });
});

describe('AccountSystem', () => {
  test('createAccount generates valid account', () => {
    const secret = toField('0x12345');
    const account = AccountSystem.createAccount(secret, 1000, 0, 1);
    
    expect(account.balance).toBe(toField(1000));
    expect(account.nonce).toBe(toField(0));
    expect(account.asset_id).toBe(toField(1));
    expect(account.pubkey).toMatch(/^0x[0-9a-f]{64}$/);
    
    // Same secret should produce same pubkey
    const account2 = AccountSystem.createAccount(secret, 500, 5, 2);
    expect(account.pubkey).toBe(account2.pubkey);
  });

  test('getAccountCommitment is deterministic', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    const commitment1 = AccountSystem.getAccountCommitment(account);
    const commitment2 = AccountSystem.getAccountCommitment(account);
    
    expect(commitment1).toBe(commitment2);
    expect(commitment1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('accountReceive updates balance and nonce', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    const newAccount = AccountSystem.accountReceive(account, 300);
    
    expect(newAccount.balance).toBe(toField(1300));
    expect(newAccount.nonce).toBe(toField(6));
    expect(newAccount.pubkey).toBe(account.pubkey);
    expect(newAccount.asset_id).toBe(account.asset_id);
  });

  test('accountSend updates balance and nonce', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    const newAccount = AccountSystem.accountSend(account, 300);
    
    expect(newAccount.balance).toBe(toField(700));
    expect(newAccount.nonce).toBe(toField(6));
    expect(newAccount.pubkey).toBe(account.pubkey);
    expect(newAccount.asset_id).toBe(account.asset_id);
  });

  test('accountSend throws on insufficient balance', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(100),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    expect(() => {
      AccountSystem.accountSend(account, 300);
    }).toThrow('Insufficient balance');
  });

  test('generateNullifier is deterministic', () => {
    const commitment = toField('0x123456789');
    const secret = toField('0xABCDEF');
    
    const nullifier1 = AccountSystem.generateNullifier(commitment, secret);
    const nullifier2 = AccountSystem.generateNullifier(commitment, secret);
    
    expect(nullifier1).toBe(nullifier2);
    expect(nullifier1).toMatch(/^0x[0-9a-f]{64}$/);
  });

  test('verifyAccount validates reasonable limits', () => {
    const validAccount: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    expect(AccountSystem.verifyAccount(validAccount)).toBe(true);
    
    // Test invalid asset ID
    const invalidAsset = { ...validAccount, asset_id: toField(0) };
    expect(AccountSystem.verifyAccount(invalidAsset)).toBe(false);
    
    // Test balance too large
    const invalidBalance = { ...validAccount, balance: toField(2000000000) };
    expect(AccountSystem.verifyAccount(invalidBalance)).toBe(false);
  });
});

describe('AccountMerkleTree', () => {
  test('basic tree operations', () => {
    const tree = new AccountMerkleTree();
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    
    // Initially empty
    expect(tree.hasAccount(account)).toBe(false);
    expect(tree.getTreeInfo().size).toBe(0);
    
    // Add account
    tree.addAccount(account);
    expect(tree.hasAccount(account)).toBe(true);
    expect(tree.getTreeInfo().size).toBe(1);
    expect(tree.getTreeInfo().accounts).toContainEqual(account);
  });

  test('constructor with initial accounts', () => {
    const { accounts } = generateTestAccounts(3);
    const tree = new AccountMerkleTree(accounts);
    
    expect(tree.getTreeInfo().size).toBe(3);
    accounts.forEach(account => {
      expect(tree.hasAccount(account)).toBe(true);
    });
  });

  test('getSimpleProof returns valid structure', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    const tree = new AccountMerkleTree([account]);
    
    const proof = tree.getSimpleProof(account);
    
    expect(proof.path).toHaveLength(20);
    expect(proof.indices).toHaveLength(20);
    expect(proof.root).toBe(AccountSystem.getAccountCommitment(account));
    
    // All path elements should be zero in simple case
    proof.path.forEach(element => {
      expect(element).toBe(toField('0'));
    });
    
    // All indices should be 0 (left) in simple case
    proof.indices.forEach(index => {
      expect(index).toBe(toField('0'));
    });
  });

  test('getSimpleProof throws for non-existent account', () => {
    const tree = new AccountMerkleTree();
    const fakeAccount: Account = {
      pubkey: toField('0x9999'),
      balance: toField(999),
      nonce: toField(99),
      asset_id: toField(9),
    };
    
    expect(() => {
      tree.getSimpleProof(fakeAccount);
    }).toThrow('not found in tree');
  });

  test('verifyProof validates simple proofs correctly', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    const tree = new AccountMerkleTree([account]);
    
    const proof = tree.getSimpleProof(account);
    const isValid = tree.verifyProof(account, proof);
    
    expect(isValid).toBe(true);
  });

  test('verifyProof rejects invalid proofs', () => {
    const account: Account = {
      pubkey: toField('0x1234'),
      balance: toField(1000),
      nonce: toField(5),
      asset_id: toField(1),
    };
    const tree = new AccountMerkleTree([account]);
    
    const proof = tree.getSimpleProof(account);
    
    // Tamper with the proof
    const invalidProof = {
      ...proof,
      root: toField('0x9999999999999999')
    };
    
    const isValid = tree.verifyProof(account, invalidProof);
    expect(isValid).toBe(false);
  });
});

describe('TransferSystem', () => {
  test('createTransfer generates valid transfer data', () => {
    const { accounts, secrets, tree } = generateTestAccounts(2);
    const [aliceAccount, bobAccount] = accounts;
    const [aliceSecret] = secrets;
    
    const transfer = TransferSystem.createTransfer(
      aliceSecret,
      aliceAccount,
      bobAccount.pubkey,
      bobAccount,
      300,
      tree
    );
    
    expect(transfer.sender).toEqual(aliceAccount);
    expect(transfer.recipient_old).toEqual(bobAccount);
    expect(transfer.transfer_amount).toBe(toField(300));
    
    // Verify balance updates
    expect(transfer.sender_new.balance).toBe(toField(700)); // 1000 - 300
    expect(transfer.recipient_new.balance).toBe(toField(1400)); // 1100 + 300
    
    // Verify nonce increments
    expect(BigInt(transfer.sender_new.nonce)).toBe(BigInt(aliceAccount.nonce) + 1n);
    expect(BigInt(transfer.recipient_new.nonce)).toBe(BigInt(bobAccount.nonce) + 1n);
  });

  test('createTransfer throws on insufficient balance', () => {
    const { accounts, secrets, tree } = generateTestAccounts(2);
    const [aliceAccount, bobAccount] = accounts;
    const [aliceSecret] = secrets;
    
    expect(() => {
      TransferSystem.createTransfer(
        aliceSecret,
        aliceAccount,
        bobAccount.pubkey,
        bobAccount,
        2000, // More than Alice has
        tree
      );
    }).toThrow('Insufficient balance');
  });

  test('generateCircuitInputs creates complete input set', () => {
    const { accounts, secrets, tree } = generateTestAccounts(2);
    const [aliceAccount, bobAccount] = accounts;
    const [aliceSecret] = secrets;
    
    const transfer = TransferSystem.createTransfer(
      aliceSecret,
      aliceAccount,
      bobAccount.pubkey,
      bobAccount,
      300,
      tree
    );
    
    const inputs = TransferSystem.generateCircuitInputs(transfer);
    
    // Verify public inputs structure
    expect(inputs.public_inputs.merkle_root).toMatch(/^0x[0-9a-f]{64}$/);
    expect(inputs.public_inputs.sender_nullifier).toMatch(/^0x[0-9a-f]{64}$/);
    expect(inputs.public_inputs.sender_new_commitment).toMatch(/^0x[0-9a-f]{64}$/);
    expect(inputs.public_inputs.recipient_new_commitment).toMatch(/^0x[0-9a-f]{64}$/);
    expect(inputs.public_inputs.asset_id).toBe(toField(1));
    
    // Verify private inputs structure
    expect(inputs.private_inputs.sender_account).toEqual(aliceAccount);
    expect(inputs.private_inputs.sender_secret_key).toBe(aliceSecret);
    expect(inputs.private_inputs.transfer_amount).toBe(toField(300));
    expect(inputs.private_inputs.recipient_pubkey).toBe(bobAccount.pubkey);
    expect(inputs.private_inputs.sender_merkle_path).toHaveLength(20);
    expect(inputs.private_inputs.sender_merkle_indices).toHaveLength(20);
  });
});

describe('Integration Tests', () => {
  test('complete Alice to Bob transfer scenario', () => {
    // Create Alice and Bob with different initial states
    const aliceSecret = toField('0xALICE');
    const bobSecret = toField('0xB0B');
    
    const aliceAccount = AccountSystem.createAccount(aliceSecret, 1000, 5, 1);
    const bobAccount = AccountSystem.createAccount(bobSecret, 200, 3, 1);
    
    // Create tree with both accounts
    const tree = new AccountMerkleTree([aliceAccount, bobAccount]);
    
    // Alice wants to send 300 to Bob
    const transfer = TransferSystem.createTransfer(
      aliceSecret,
      aliceAccount,
      bobAccount.pubkey,
      bobAccount,
      300,
      tree
    );
    
    // Generate circuit inputs
    const inputs = TransferSystem.generateCircuitInputs(transfer);
    
    // Verify the transfer makes sense
    expect(transfer.sender_new.balance).toBe(toField(700));
    expect(transfer.recipient_new.balance).toBe(toField(500));
    
    // Verify commitments are different after transfer
    const aliceOldCommitment = AccountSystem.getAccountCommitment(aliceAccount);
    const aliceNewCommitment = AccountSystem.getAccountCommitment(transfer.sender_new);
    const bobOldCommitment = AccountSystem.getAccountCommitment(bobAccount);
    const bobNewCommitment = AccountSystem.getAccountCommitment(transfer.recipient_new);
    
    expect(aliceOldCommitment).not.toBe(aliceNewCommitment);
    expect(bobOldCommitment).not.toBe(bobNewCommitment);
    
    // Verify nullifier is unique
    expect(inputs.public_inputs.sender_nullifier).toMatch(/^0x[0-9a-f]{64}$/);
    
    console.log('Alice → Bob Transfer Test Data:');
    console.log(`Alice Old Balance: ${aliceAccount.balance}`);
    console.log(`Alice New Balance: ${transfer.sender_new.balance}`);
    console.log(`Bob Old Balance: ${bobAccount.balance}`);
    console.log(`Bob New Balance: ${transfer.recipient_new.balance}`);
    console.log(`Transfer Amount: ${transfer.transfer_amount}`);
    console.log(`Alice Old Commitment: ${aliceOldCommitment}`);
    console.log(`Alice New Commitment: ${aliceNewCommitment}`);
    console.log(`Bob New Commitment: ${bobNewCommitment}`);
  });

  test('multiple transfers from same account', () => {
    const aliceSecret = toField('0xALICE');
    const bobSecret = toField('0xB0B');
    const charlieSecret = toField('0xCHARLIE');
    
    let aliceAccount = AccountSystem.createAccount(aliceSecret, 1000, 0, 1);
    const bobAccount = AccountSystem.createAccount(bobSecret, 0, 0, 1);
    const charlieAccount = AccountSystem.createAccount(charlieSecret, 0, 0, 1);
    
    const tree = new AccountMerkleTree([aliceAccount, bobAccount, charlieAccount]);
    
    // First transfer: Alice → Bob (300)
    const transfer1 = TransferSystem.createTransfer(
      aliceSecret,
      aliceAccount,
      bobAccount.pubkey,
      bobAccount,
      300,
      tree
    );
    
    // Update Alice's account for next transfer
    aliceAccount = transfer1.sender_new;
    tree.addAccount(aliceAccount); // Add updated Alice to tree
    
    // Second transfer: Alice → Charlie (200)
    const transfer2 = TransferSystem.createTransfer(
      aliceSecret,
      aliceAccount,
      charlieAccount.pubkey,
      charlieAccount,
      200,
      tree
    );
    
    // Verify final balances
    expect(transfer1.sender_new.balance).toBe(toField(700)); // After first transfer
    expect(transfer2.sender_new.balance).toBe(toField(500)); // After second transfer
    expect(transfer1.recipient_new.balance).toBe(toField(300)); // Bob
    expect(transfer2.recipient_new.balance).toBe(toField(200)); // Charlie
    
    // Verify nonces increment correctly
    expect(transfer1.sender_new.nonce).toBe(toField(1)); // 0 + 1
    expect(transfer2.sender_new.nonce).toBe(toField(2)); // 1 + 1
  });

  test('account state transitions preserve identity', () => {
    const secret = toField('0x12345');
    let account = AccountSystem.createAccount(secret, 1000, 0, 1);
    const originalPubkey = account.pubkey;
    const originalAssetId = account.asset_id;
    
    // Multiple operations
    account = AccountSystem.accountSend(account, 100);
    account = AccountSystem.accountReceive(account, 50);
    account = AccountSystem.accountSend(account, 200);
    account = AccountSystem.accountReceive(account, 300);
    
    // Identity should be preserved
    expect(account.pubkey).toBe(originalPubkey);
    expect(account.asset_id).toBe(originalAssetId);
    
    // Final balance should be correct: 1000 - 100 + 50 - 200 + 300 = 1050
    expect(account.balance).toBe(toField(1050));
    
    // Nonce should have incremented 4 times: 0 + 4 = 4
    expect(account.nonce).toBe(toField(4));
  });
});

describe('Edge Cases and Security', () => {
  test('zero balance accounts are valid', () => {
    const secret = toField('0x12345');
    const account = AccountSystem.createAccount(secret, 0, 0, 1);
    
    expect(AccountSystem.verifyAccount(account)).toBe(true);
    expect(account.balance).toBe(toField(0));
  });

  test('accounts with large but valid balances work', () => {
    const secret = toField('0x12345');
    const account = AccountSystem.createAccount(secret, 999999999, 999999999, 1);
    
    expect(AccountSystem.verifyAccount(account)).toBe(true);
  });

  test('different assets create different commitments', () => {
    const secret = toField('0x12345');
    const account1 = AccountSystem.createAccount(secret, 1000, 0, 1);
    const account2 = AccountSystem.createAccount(secret, 1000, 0, 2);
    
    const commitment1 = AccountSystem.getAccountCommitment(account1);
    const commitment2 = AccountSystem.getAccountCommitment(account2);
    
    expect(commitment1).not.toBe(commitment2);
  });

  test('nullifiers are unique per account state', () => {
    const secret = toField('0x12345');
    const account1 = AccountSystem.createAccount(secret, 1000, 0, 1);
    const account2 = AccountSystem.accountSend(account1, 100);
    
    const commitment1 = AccountSystem.getAccountCommitment(account1);
    const commitment2 = AccountSystem.getAccountCommitment(account2);
    
    const nullifier1 = AccountSystem.generateNullifier(commitment1, secret);
    const nullifier2 = AccountSystem.generateNullifier(commitment2, secret);
    
    expect(nullifier1).not.toBe(nullifier2);
  });

  test('performance with many accounts', () => {
    const startTime = Date.now();
    const { tree } = generateTestAccounts(100);
    const creationTime = Date.now() - startTime;
    
    expect(creationTime).toBeLessThan(1000); // Should be fast
    expect(tree.getTreeInfo().size).toBe(100);
    
    // Test proof generation performance
    const testAccount = tree.getTreeInfo().accounts[0];
    const proofStartTime = Date.now();
    const proof = tree.getSimpleProof(testAccount);
    const proofTime = Date.now() - proofStartTime;
    
    expect(proofTime).toBeLessThan(100); // Should be very fast
    expect(tree.verifyProof(testAccount, proof)).toBe(true);
  });
});