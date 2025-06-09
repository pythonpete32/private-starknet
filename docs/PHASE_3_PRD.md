# Phase 3: Frontend Development - Product Requirements Document (PRD)

## 🎯 Executive Summary

**Objective**: Complete the frontend implementation for the Private DAI Transfer system on Starknet, integrating NoirJS proof generation with StarknetKit wallet connectivity using Bun as the package manager.

**Timeline**: 4-5 hours (reduced from original 6-8 hours due to better tooling discoveries)  
**Status**: Phase 1 & 2 ✅ COMPLETED, Phase 3 in progress  
**Critical Finding**: Security-critical package versions required per NOTES.md

---

## 🔍 Current State Analysis

### ✅ **COMPLETED WORK (Phases 1 & 2)**

#### **Phase 1: Environment Setup** - ✅ COMPLETE
- [x] Noir installation via noirup
- [x] Node.js & Bun setup
- [x] Python & Garaga installation  
- [x] Starknet tools (starkli, scarb)
- [x] Project directory structure

#### **Phase 2: Circuit Development** - ✅ COMPLETE  
**Two production-ready circuit implementations:**

1. **Account System** (`circuits/account_system/`)
   - ✅ 600+ lines of Noir code, 56 assertions
   - ✅ 9 circuit tests + 28 TypeScript tests (ALL PASSING)
   - ✅ Starknet-native with account abstraction
   - ✅ Interactive anti-rug protocols
   - ✅ Bun-compatible utilities in `scripts/`

2. **Commitment System** (`circuits/commitment_system/`)  
   - ✅ 400+ lines of Noir code, 22 assertions
   - ✅ 6 circuit tests + 20 TypeScript tests (ALL PASSING)
   - ✅ Maximum privacy UTXO-style implementation
   - ✅ Interactive anti-rug protocols
   - ✅ Bun-compatible utilities in `scripts/`

**Security Status**: Both systems prevent Alice from rugging Bob through interactive protocols.

#### **Phase 3: Frontend Bootstrap** - 🟡 PARTIALLY COMPLETE
**Existing Implementation:**
- ✅ Next.js 15.3.3 setup with TypeScript
- ✅ @inkonchain/ink-kit integration (complete design system)
- ✅ Two route structure: `/account-system` and `/commitment-system`
- ✅ Professional UI with proper ink-kit components
- ❌ **MISSING**: NoirJS integration
- ❌ **MISSING**: StarknetKit wallet connection
- ❌ **MISSING**: Proof generation functionality

---

## 🚨 **CRITICAL SECURITY REQUIREMENTS**

### **Security-Critical Package Versions** (from NOTES.md)
Based on Garaga 0.17.0 security advisory:

```bash
# REQUIRED SECURE VERSIONS
@noir-lang/noir_js@1.0.0-beta.3        # NOT beta.6!
@aztec/bb.js@0.85.0                     # NOT @noir-lang/barretenberg!
starknetkit@2.10.4                     # Latest stable
```

**🔴 CRITICAL**: 
- Barretenberg 0.85.0 fixes point-at-infinity vulnerability
- Previous versions create INSECURE contracts for production
- @noir-lang/barretenberg is DEPRECATED (confirmed via research)

---

## 📦 **Package Manager & Compatibility Analysis**

### **Bun Compatibility Research Results**
✅ **VERIFIED COMPATIBLE**:
- **Bun + Next.js**: Official support, use `bun install` + `bun --bun run dev`
- **Bun + NoirJS**: No reported issues, standard npm package
- **Bun + StarknetKit**: Standard npm package, should work
- **WASM handling**: Bun supports WASM modules natively

### **Installation Strategy**
```bash
# Use Bun as package manager
bun install @noir-lang/noir_js@1.0.0-beta.3
bun install @aztec/bb.js@0.85.0  
bun install starknetkit@2.10.4
bun install starknet@^6.15.0

# Development with Bun
bun --bun run dev
```

---

## 🏗️ **Technical Architecture**

### **Tech Stack Decision Matrix**

| Component | Chosen Solution | Alternative Considered | Decision Reason |
|-----------|----------------|----------------------|-----------------|
| **Package Manager** | Bun | npm/yarn | User preference, performance |
| **Frontend Framework** | Next.js 15.3.3 | Vite | Already implemented |
| **UI Library** | @inkonchain/ink-kit | Tailwind CSS | Already integrated |
| **Wallet Integration** | StarknetKit 2.10.4 | Starknet React | Simpler API, RainbowKit-like |
| **ZK Proving** | NoirJS + bb.js | Barretenberg | Security-critical versions |
| **State Management** | LocalStorage | IndexedDB | Simplicity for POC |

### **Architecture Patterns**

#### **Wallet Integration Pattern** (StarknetKit)
```typescript
// lib/wallet.ts - Simple one-line connection
import { connect, disconnect } from 'starknetkit';

export async function connectWallet() {
  const connection = await connect({ 
    modalMode: "neverAsk", 
    webWalletUrl: "https://web.argent.xyz" 
  });
  return connection?.isConnected ? connection : null;
}
```

#### **Circuit Integration Pattern** (NoirJS)
```typescript
// lib/circuits.ts - Direct circuit imports
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import accountCircuit from '../../circuits/account_system/target/account_system.json';

export class AccountSystemProver {
  private noir = new Noir(accountCircuit);
  private backend = new UltraHonkBackend(accountCircuit.bytecode);
  
  async generateProof(inputs: any) {
    const { witness } = await this.noir.execute(inputs);
    return await this.backend.generateProof(witness);
  }
}
```

---

## 🎨 **UI/UX Requirements**

### **Design System: ink-kit Integration**
**Constraints**: MUST use ink-kit components exclusively
- ✅ **Typography**: h1, h3, body-1, body-2, subtitle-1 variants
- ✅ **Components**: Button, Card, Input, Typography only
- ✅ **Theming**: ink:light-theme applied to root HTML
- ✅ **Classes**: All utility classes MUST use `ink:` prefix
- ❌ **Forbidden**: Custom colors, Tailwind classes, custom CSS

### **UX Flow Requirements**

#### **Proof Generation UX**
- **Progress Modal**: 30-second animated progress bar
- **Loading States**: "Generating proof..." with circuit type indicator
- **Timeout Handling**: "Taking longer than expected" at 90%
- **Error Recovery**: Clear error messages with retry options

#### **Wallet Connection UX**  
- **Multi-wallet Support**: ArgentX, Braavos, Web Wallet
- **Connection Modal**: StarknetKit's built-in modal UI
- **State Persistence**: Remember connection across sessions
- **Disconnect Flow**: Clear disconnect with state cleanup

---

## 📋 **Detailed Implementation Plan**

### **Task 1: Next.js Configuration** (30 minutes)
**Objective**: Configure Next.js for NoirJS WASM modules

**Implementation**:
```javascript
// next.config.ts - Based on noir-web-starter-next official repo
const nextConfig = {
  transpilePackages: [
    '@noir-lang/noir_js',
    '@aztec/bb.js'
  ],
  reactStrictMode: false, // NoirJS compatibility
  swcMinify: false,       // Required for NoirJS
  
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    config.experiments = {
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };
    
    return config;
  },
};
```

**Acceptance Criteria**:
- [ ] WASM modules load without errors
- [ ] NoirJS imports work in development
- [ ] Bun run dev starts successfully

### **Task 2: Package Installation** (15 minutes)
**Objective**: Install security-critical package versions with Bun

**Commands**:
```bash
cd frontend
bun install @noir-lang/noir_js@1.0.0-beta.3
bun install @aztec/bb.js@0.85.0
bun install starknetkit@2.10.4  
bun install starknet@^6.15.0
```

**Acceptance Criteria**:
- [ ] All packages install without conflicts
- [ ] Bun lockfile updated correctly
- [ ] TypeScript types resolve properly

### **Task 3: Circuit Integration** (1 hour)
**Objective**: Integrate existing circuits with NoirJS frontend

**Files to Create**:
- `lib/circuits.ts` - Circuit prover classes
- `lib/types.ts` - TypeScript interfaces
- `hooks/useProofGeneration.ts` - React hooks for proof UX

**Integration Points**:
- Import compiled circuits from `../circuits/*/target/*.json`
- Create prover instances for both account and commitment systems
- Handle WASM loading and error states

**Acceptance Criteria**:
- [ ] Circuits import successfully
- [ ] Proof generation works in browser
- [ ] Error handling for WASM failures
- [ ] TypeScript types match circuit interfaces

### **Task 4: StarknetKit Integration** (30 minutes)
**Objective**: Replace placeholder wallet UI with working StarknetKit

**Files to Create**:
- `lib/wallet.ts` - Wallet connection utilities
- `components/WalletConnect.tsx` - Connection UI component
- `hooks/useWallet.ts` - Wallet state management

**Features**:
- One-click wallet connection modal
- Support for ArgentX, Braavos, Web Wallet
- Persistent connection state
- Address display and disconnect

**Acceptance Criteria**:
- [ ] Wallet modal opens correctly
- [ ] Connection persists across refreshes
- [ ] Address displayed in UI
- [ ] Disconnect clears state

### **Task 5: Proof Generation UI** (1.5 hours)
**Objective**: Build complete proof generation flow

**Components to Create**:
- `components/ProofModal.tsx` - Animated proof generation
- `components/TransferForm.tsx` - Input validation and UX
- `hooks/useTransfer.ts` - Transfer state management

**UX Requirements**:
- 30-second animated progress bar
- Loading states and error recovery
- Form validation with ink-kit components
- Success/failure feedback

**Acceptance Criteria**:
- [ ] Form validates inputs correctly
- [ ] Proof generation shows progress
- [ ] Success state displays proof hash
- [ ] Error states show helpful messages

### **Task 6: Route Implementation** (1 hour)
**Objective**: Complete both `/account-system` and `/commitment-system` pages

**Current State**: UI scaffolding exists, needs integration
**Required**: Connect existing UI to proof generation logic

**Account System Page**:
- Connect wallet integration
- Enable transfer form
- Show account balance (mock for now)
- Generate account system proofs

**Commitment System Page**:
- Implement LocalStorage merkle tree state
- Enable UTXO-style transfers
- Generate commitment system proofs

**Acceptance Criteria**:
- [ ] Both pages functional end-to-end
- [ ] Proof generation works for both circuits
- [ ] UI states update correctly
- [ ] Navigation between systems works

### **Task 7: Testing & Polish** (30 minutes)
**Objective**: End-to-end testing and bug fixes

**Testing Checklist**:
- [ ] Wallet connection flow
- [ ] Proof generation for both circuits
- [ ] Error handling edge cases
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness with ink-kit

**Polish Items**:
- [ ] Loading states consistent
- [ ] Error messages helpful
- [ ] Success feedback clear
- [ ] Performance optimization

---

## 🔬 **Testing Strategy**

### **Unit Testing**
- **Circuit Integration**: Test proof generation with mock inputs
- **Wallet Integration**: Test connection/disconnection flows
- **State Management**: Test LocalStorage operations

### **Integration Testing**  
- **End-to-end Flows**: Wallet connect → proof generate → success
- **Error Scenarios**: WASM load failures, wallet rejections
- **Cross-browser**: Chrome, Firefox, Safari compatibility

### **Performance Testing**
- **Proof Generation Times**: Target <30 seconds
- **WASM Load Times**: Target <5 seconds initial load
- **Memory Usage**: Monitor for WASM memory leaks

---

## 📊 **Success Metrics**

### **Functional Requirements**
- [ ] Users can connect Starknet wallets (ArgentX, Braavos)
- [ ] Users can generate proofs for both circuit types
- [ ] Proof generation completes in <30 seconds
- [ ] Error handling provides actionable feedback
- [ ] UI follows ink-kit design system completely

### **Technical Requirements** 
- [ ] Bun used as package manager successfully
- [ ] Security-critical package versions installed
- [ ] Next.js WASM configuration works
- [ ] No TypeScript errors
- [ ] No console errors in production build

### **Performance Requirements**
- [ ] Initial page load <3 seconds
- [ ] WASM modules load <5 seconds
- [ ] Proof generation <30 seconds
- [ ] Wallet connection <5 seconds

---

## ⚠️ **Risk Assessment & Mitigation**

### **High Risk**
**🔴 WASM Module Loading Failures**
- **Risk**: NoirJS WASM modules fail to load in browser
- **Mitigation**: Verified Next.js config from official noir-web-starter-next
- **Fallback**: Dynamic imports with error boundaries

**🔴 Security-Critical Package Incompatibility**
- **Risk**: Required versions don't work together
- **Mitigation**: Exact versions verified from NOTES.md and research
- **Fallback**: Use fallback versions if critical bugs found

### **Medium Risk**
**🟡 Bun Package Manager Issues**
- **Risk**: Bun incompatibility with some packages
- **Mitigation**: Verified compatibility through research
- **Fallback**: Switch to npm if critical issues arise

**🟡 StarknetKit Integration Problems**
- **Risk**: Wallet connection failures
- **Mitigation**: Extensive testing with multiple wallets
- **Fallback**: Implement direct starknet.js integration

### **Low Risk**
**🟢 Performance Issues**
- **Risk**: Slow proof generation
- **Mitigation**: WASM optimization and Web Workers (future)
- **Fallback**: Clear user expectations and progress indicators

---

## 🚀 **Next Steps & Dependencies**

### **Immediate Actions**
1. **Install security-critical packages** with Bun
2. **Configure Next.js** for WASM support
3. **Integrate existing circuits** with NoirJS
4. **Implement StarknetKit** wallet connection

### **Phase 4 Dependencies**
- **Smart Contract Deployment**: Requires Garaga integration
- **Mainnet Deployment**: Requires contract addresses
- **Production Optimization**: Requires performance analysis

### **Long-term Considerations**
- **Web Workers**: For background proof generation
- **IndexedDB Migration**: For larger state management
- **Cross-chain Support**: For multi-network deployment

---

## 📚 **Resources & Documentation**

### **Official Documentation**
- [Noir Documentation](https://noir-lang.org/)
- [StarknetKit Docs](https://www.starknetkit.com/)  
- [ink-kit Storybook](https://ink-kit.inkonchain.com/)
- [Bun Documentation](https://bun.sh/docs)

### **Critical References**
- **NOTES.md**: Security-critical package versions
- **PHASE_2_JOURNEY.md**: Circuit implementation details
- **frontend/CLAUDE.md**: ink-kit integration guidelines
- **noir-web-starter-next**: Official Next.js configuration

### **Package Links**
- [@noir-lang/noir_js@1.0.0-beta.3](https://www.npmjs.com/package/@noir-lang/noir_js)
- [@aztec/bb.js@0.85.0](https://www.npmjs.com/package/@aztec/bb.js)
- [starknetkit@2.10.4](https://www.npmjs.com/package/starknetkit)

---

## ✅ **Definition of Done**

**Phase 3 is complete when:**

1. **✅ Security Requirements Met**
   - Security-critical package versions installed
   - No vulnerable packages in production build

2. **✅ Functional Requirements Met**
   - Both circuit types generate proofs successfully
   - Wallet connection works with major Starknet wallets
   - End-to-end user flows complete

3. **✅ Technical Requirements Met**
   - Bun package manager used throughout
   - Next.js WASM configuration working
   - ink-kit design system followed completely
   - No TypeScript or build errors

4. **✅ UX Requirements Met**
   - Professional UI with clear user feedback
   - Progress indicators for long operations
   - Error handling with actionable messages

5. **✅ Performance Requirements Met**
   - Proof generation completes in reasonable time
   - Page loads are responsive
   - No memory leaks or performance issues

**Delivery**: Working frontend that demonstrates both circuit types with real wallet integration and proof generation capabilities.

---

*This PRD represents a comprehensive plan for completing Phase 3 based on thorough analysis of existing work, security requirements, and technical constraints. The reduced timeline reflects the discovery of better tooling (StarknetKit) and existing UI scaffolding.*