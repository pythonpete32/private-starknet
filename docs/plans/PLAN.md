# Private DAI Transfer on Starknet

## 🎯 Project Overview

Build a web application that enables users to transfer DAI tokens privately on Starknet. Users can deposit DAI into a private account, transfer it to other users without revealing amounts or addresses, and withdraw back to their public account.

### How It Works
1. User deposits DAI from their public wallet into the private system
2. User generates a zero-knowledge proof locally in their browser
3. Proof is submitted to Starknet (only the proof, no transaction details)
4. Recipient can claim their DAI using their private key

## 🔒 Privacy Model & Security Assumptions

### What IS Private (Today)
- **Transfer Amounts**: The amount being sent is hidden inside the ZK proof
- **Account Balances**: Your private DAI balance is never revealed on-chain
- **Sender Identity**: The link between sender's public wallet and private account
- **Recipient Identity**: The link between recipient's public wallet and private account
- **Transaction Graph**: Cannot trace funds between private accounts

### What is NOT Private (Current Limitations)
- **Deposit Events**: When you deposit DAI, this is visible on-chain (amount + wallet)
- **Withdrawal Events**: When you withdraw DAI, this is visible on-chain
- **Transaction Timing**: When a private transfer occurs (not who or how much)
- **Gas Payment**: Your Starknet wallet address when submitting the proof
- **Mempool Exposure**: During the ~10 second window before block inclusion:
  - Your wallet address is visible
  - The proof bytes are visible (but meaningless without the private inputs)
  - Transaction can be front-run or censored by sequencer

### Why This Architecture?

We chose this specific stack because:

1. **Noir + NoirJS**: Mature browser proving (works today)
2. **Garaga**: Bridge between Noir and Starknet (no Cairo knowledge needed)
3. **Starknet**: Cheap verification costs (~$0.10 per private transfer)
4. **Client-side proving**: True privacy (data never leaves your device)

## 🛠 Tech Stack

- **ZK Circuit**: Noir (Aztec's ZK language)
- **Browser Proving**: NoirJS + Barretenberg WASM
- **Smart Contracts**: Cairo (Starknet's language)
- **Proof Verification**: Garaga SDK (converts Noir proofs → Cairo verifiers)
- **Blockchain**: Starknet Mainnet
- **Frontend**: Vanilla JS + Vite
- **Wallet**: Argent/Braavos (Starknet wallets)

## 📁 Repository Structure

```
private-dai-starknet/
├── circuits/          # Noir ZK circuits
├── contracts/         # Cairo smart contracts  
├── frontend/          # Web application
└── scripts/           # Deployment & testing scripts
```

**Note**: This can be a simple repository - no need for a monorepo setup. Each directory is just a different part of the same project.

## ✅ Implementation Checklist

### Phase 1: Environment Setup
- [x] Install Noir (noirup)
- [x] Install Node.js & npm
- [x] Install Python & Garaga
- [x] Install Starknet tools (starkli, scarb)
- [x] Create project directory structure

### Phase 2: ZK Circuit Development ✅ COMPLETED
- [x] Design account/balance commitment structure
- [x] Write Noir circuit for private transfers
- [x] Implement merkle tree verification (prevents fake balance attacks)
- [x] Add nullifier generation (prevent double-spending)
- [x] Create test cases for the circuit
- [x] Compile and test locally with Nargo
- [x] Create TypeScript/Bun utilities for Merkle proof generation
- [x] Add comprehensive documentation and usage guide

### Phase 3: Frontend Development ✅ **COMPLETED - STRATEGY: Option C - Hybrid Demo Approach**
- [x] Setup Next.js project with NoirJS ✅ Working
- [x] Create proof generation module ✅ **BREAKTHROUGH! Constraint errors resolved**
- [x] Build merkle tree management ✅ **COMPLETED! Real multi-user tree with persistence**
- [x] Design transfer UI ✅ Professional @inkonchain/ink-kit interface  
- [x] Add wallet connection (Starknet.js) ✅ StarknetKit integration working
- [x] Implement local account storage ✅ **COMPLETED! Account persistence working**

**Status**: **6/6 Complete (100%)** ✅ **PHASE 3 COMPLETE!**  
**Architecture Decision**: Successfully implemented Merkle tree circuits with demo tree management  
**Major Achievements**: Fixed circuit compatibility, built real multi-user tree, solved BN254 field constraints  
**Detailed Analysis**: See `docs/PHASE_3_RETROSPECTIVE.md` for complete technical retrospective

### Phase 4: Smart Contract Development
- [ ] **Circuit Architecture Refactor** ⚠️ **Technical Debt - Must Complete First**
  - [ ] Merge `pedersen_hash_multi` + `account_system` into single circuit
  - [ ] Update frontend to use unified circuit interface
  - [ ] Validate performance improvements and security compliance
  - [ ] **Details**: See `docs/plans/CIRCUIT_ARCHITECTURE_DEBT.md`
- [ ] Generate Cairo verifier using Garaga
- [ ] Write main PrivateDAI contract
- [ ] Implement deposit functionality
- [ ] Add private transfer logic
- [ ] Create withdrawal mechanism
- [ ] Write contract tests

**⚠️ Critical**: Circuit refactor must complete first - smart contracts depend on final circuit interface

### Phase 5: Integration
- [ ] Connect frontend to Noir circuit
- [ ] Link frontend to Starknet contracts
- [ ] Test proof generation → verification flow
- [ ] Add error handling
- [ ] Implement transaction status tracking

### Phase 6: Deployment
- [ ] Deploy contracts to Starknet testnet
- [ ] Test full flow on testnet
- [ ] Deploy to Starknet mainnet
- [ ] Configure frontend for mainnet
- [ ] Set up contract monitoring

### Phase 7: Production Enhancements
- [ ] Add relayer for gas abstraction
- [ ] Implement batch transfers
- [ ] Create indexer for commitment tree
- [ ] Add compliance mode (optional KYC)
- [ ] Build mobile-friendly UI
- [ ] Security audit

## 🔐 Key Privacy Features

- **Hidden Amounts**: Transfer amounts are never revealed on-chain
- **Hidden Addresses**: Sender and recipient addresses remain private
- **Hidden Balances**: Account balances are encrypted
- **Unlinkable Transactions**: Transfers cannot be traced between parties

## ⚠️ Current Limitations

- **Mempool Privacy**: Without encrypted mempool, some metadata is visible during transaction submission
- **Deposit/Withdraw Privacy**: Entry and exit points are public
- **Gas Payment**: Gas fees still paid from public account (linkable)

## 🚀 Getting Started

1. Clone the repository
2. Follow setup instructions in each directory
3. Start with the circuit, then frontend, then contracts
4. Test locally before deploying to testnet

## 📚 Resources

- [Noir Documentation](https://noir-lang.org/)
- [Garaga Documentation](https://github.com/keep-starknet-strange/garaga)
- [Starknet Documentation](https://docs.starknet.io/)
- [NoirJS Tutorial](https://noir-lang.org/docs/tutorials/noirjs_app)