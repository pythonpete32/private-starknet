/**
 * Debug script to test proof generation outside of React
 * This helps isolate the circuit execution from frontend complexities
 */

import { createAccountSystemProver, createPedersenHasher } from './src/lib/circuits-client.js';

async function debugProofGeneration() {
  console.log('🚀 Starting proof generation debug...');
  
  try {
    // Initialize the hasher and prover
    console.log('📦 Initializing circuits...');
    const hasher = await createPedersenHasher();
    const prover = await createAccountSystemProver();
    
    // Test basic Pedersen hash first
    console.log('\n🔐 Testing Pedersen hash...');
    const secretKey = "12345";
    const pubkey = await hasher.hashSingle(secretKey);
    console.log('Secret key:', secretKey);
    console.log('Generated pubkey:', pubkey);
    
    // Create test inputs following the exact circuit format
    console.log('\n🔧 Creating circuit inputs...');
    const assetId = "1";
    const amount = "100";
    const senderBalance = "1000";
    const recipient = "0x123456789ABCDEF";
    
    // Create sender account with proper structure
    const senderAccount = {
      pubkey: pubkey,
      balance: senderBalance,
      nonce: "0",
      asset_id: assetId
    };
    
    // Calculate commitment hash
    const senderCommitment = await hasher.hashQuadruple(
      senderAccount.pubkey,
      senderAccount.balance,
      senderAccount.nonce,
      senderAccount.asset_id
    );
    
    // Create nullifier  
    const nullifier = await hasher.hashDouble(senderCommitment, secretKey);
    
    // Create new sender account after transfer
    const senderNewAccount = {
      pubkey: senderAccount.pubkey,
      balance: (BigInt(senderAccount.balance) - BigInt(amount)).toString(),
      nonce: (BigInt(senderAccount.nonce) + BigInt(1)).toString(),
      asset_id: senderAccount.asset_id
    };
    
    const senderNewCommitment = await hasher.hashQuadruple(
      senderNewAccount.pubkey,
      senderNewAccount.balance,
      senderNewAccount.nonce,
      senderNewAccount.asset_id
    );
    
    // Create recipient data
    const recipientOldBalance = "0";
    const recipientOldNonce = "0";
    const recipientNewAccount = {
      pubkey: recipient,
      balance: (BigInt(recipientOldBalance) + BigInt(amount)).toString(),
      nonce: (BigInt(recipientOldNonce) + BigInt(1)).toString(),
      asset_id: assetId
    };
    
    const recipientNewCommitment = await hasher.hashQuadruple(
      recipientNewAccount.pubkey,
      recipientNewAccount.balance,
      recipientNewAccount.nonce,
      recipientNewAccount.asset_id
    );
    
    // Prepare final inputs
    const inputs = {
      // Public inputs
      merkle_root: senderCommitment,
      sender_nullifier: nullifier,
      sender_new_commitment: senderNewCommitment,
      recipient_new_commitment: recipientNewCommitment,
      asset_id: assetId,
      
      // Private inputs
      sender_account: senderAccount,
      sender_secret_key: secretKey,
      transfer_amount: amount,
      recipient_pubkey: recipient,
      recipient_old_balance: recipientOldBalance,
      recipient_old_nonce: recipientOldNonce,
      sender_new_account: senderNewAccount,
      sender_merkle_path: Array(20).fill("0"),
      sender_merkle_indices: Array(20).fill("0")
    };
    
    console.log('\n✅ All inputs prepared:');
    console.log(JSON.stringify(inputs, null, 2));
    
    // Test the key constraint that was failing
    console.log('\n🔍 Constraint verification:');
    const expectedPubkey = await hasher.hashSingle(secretKey);
    console.log('Expected pubkey from secret:', expectedPubkey);
    console.log('Account pubkey:', senderAccount.pubkey);
    console.log('Match:', expectedPubkey === senderAccount.pubkey);
    
    if (expectedPubkey !== senderAccount.pubkey) {
      throw new Error('CRITICAL: Pubkey constraint will fail!');
    }
    
    // Generate proof
    console.log('\n🎯 Generating proof...');
    const result = await prover.generateProof(inputs);
    
    console.log('🎉 SUCCESS! Proof generated:');
    console.log('Proof size:', result.proof.length, 'bytes');
    console.log('Public inputs count:', result.publicInputs.length);
    
  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the debug function
debugProofGeneration().catch(console.error);