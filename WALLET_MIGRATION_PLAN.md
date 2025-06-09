# Wallet Connection Migration Plan

## 🚨 **Problem Statement**

We have **two separate, conflicting wallet connection systems** that don't communicate with each other:

1. **WalletConnect Component** - Uses starknetkit directly with custom state
2. **WalletManager Class + useWallet Hook** - Custom wrapper around starknetkit

**Result**: Connecting with one button doesn't update the other. Users can be "connected" to two different wallets simultaneously.

---

## 📋 **Current System Audit**

### **System 1: WalletConnect Component** 
**Location**: `/src/components/WalletConnect.tsx`

```typescript
// ❌ NON-IDIOMATIC: Direct starknetkit usage in component
const { wallet, connectorData } = await connect({
  modalMode: 'alwaysAsk',
  connectors: [/* manually defined connectors */]
});

// ❌ Custom localStorage management
localStorage.setItem('wallet_address', address);

// ❌ Custom event emission
window.dispatchEvent(new CustomEvent('walletConnected', { detail: {...} }));
```

**State Management**: 
- Local component state (`useState`)
- Custom localStorage keys
- Custom DOM events

### **System 2: WalletManager + useWallet**
**Location**: `/src/lib/wallet.ts` + `/src/hooks/useWallet.ts`

```typescript
// ❌ NON-IDIOMATIC: Custom wrapper class
export class WalletManager {
  static async connectWallet() {
    const { wallet, connectorData } = await connect({
      modalMode: "alwaysAsk", // Different config than System 1
      // Uses default connectors (different from System 1)
    });
  }
}

// ❌ Custom hook wrapping custom class
export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  // Custom state management
}
```

**State Management**:
- Custom TypeScript types (`WalletConnection`)
- Different localStorage keys (`wallet_connected`, `wallet_address`) 
- React hook state separate from System 1

---

## 🔍 **Legacy Code Locations**

### **Files Using System 1 (WalletConnect)**:
- `/src/components/WalletConnect.tsx` - Main component
- `/src/app/components/AppShell.tsx` - Uses WalletConnect (now replaced with SimpleWalletButton)
- `/src/app/account-system/page.tsx` - Listens to WalletConnect events:
  ```typescript
  useEffect(() => {
    const handleWalletConnected = (event: any) => {
      const walletAddress = event.detail?.address || '';
      setAddress(walletAddress);
      setIsConnected(true);
    };
    window.addEventListener('walletConnected', handleWalletConnected);
  }, []);
  ```

### **Files Using System 2 (WalletManager)**:
- `/src/lib/wallet.ts` - WalletManager class
- `/src/hooks/useWallet.ts` - useWallet hook 
- `/src/components/SimpleWalletButton.tsx` - Uses useWallet hook
- `/src/components/AccountManager.tsx` - Uses useWallet hook
- `/src/app/simple-test/page.tsx` - Uses useWallet hook

### **Provider Integration**:
- `/src/app/providers.tsx` - ❌ **MISSING StarknetConfig provider entirely**
- `/src/app/layout.tsx` - Wraps app with Providers

---

## ✅ **Idiomatic StarknetKit Pattern**

### **How It Should Work** (from https://www.starknetkit.com/docs/latest/getting-started/usage):

```typescript
// 1. Configure connectors once at app level
const connectors = [
  new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
];

// 2. Wrap app with StarknetConfig provider
<StarknetConfig
  chains={[mainnet, sepolia]}
  provider={publicProvider()}
  connectors={connectors}
  autoConnect={true}
>
  <App />
</StarknetConfig>

// 3. Use official hooks in components
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // No custom state management needed!
}
```

### **Benefits of Idiomatic Pattern**:
- ✅ **Single source of truth** - All components use same state
- ✅ **Automatic persistence** - StarknetKit handles localStorage
- ✅ **Auto-reconnect** - Built-in reconnection logic
- ✅ **Type safety** - Official TypeScript types
- ✅ **No custom events** - React state propagation
- ✅ **Centralized config** - Connectors defined once

---

## 🛠 **Migration Plan**

### **Phase 1: Setup Idiomatic Foundation**
1. **Install starknet-react** (if not already installed):
   ```bash
   bun add @starknet-react/core @starknet-react/chains
   ```

2. **Update providers.tsx** with StarknetConfig:
   ```typescript
   import { StarknetConfig, publicProvider } from "@starknet-react/core";
   import { mainnet, sepolia } from "@starknet-react/chains";
   
   const connectors = [
     new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
     new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
     new WebWalletConnector({ url: "https://web.argent.xyz" }),
   ];
   
   export default function Providers({ children }) {
     return (
       <StarknetConfig
         chains={[mainnet, sepolia]}
         provider={publicProvider()}
         connectors={connectors}
         autoConnect
       >
         <NextThemesProvider>
           {children}
         </NextThemesProvider>
       </StarknetConfig>
     );
   }
   ```

### **Phase 2: Replace Custom Components**
3. **Create new IdioWalletButton**:
   ```typescript
   // /src/components/IdioWalletButton.tsx
   import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
   
   export function IdioWalletButton() {
     const { address, isConnected } = useAccount();
     const { connect, connectors } = useConnect();
     const { disconnect } = useDisconnect();
     
     if (!isConnected) {
       return (
         <Button onClick={() => connect({ connector: connectors[0] })}>
           Connect Wallet
         </Button>
       );
     }
     
     return (
       <Button onClick={() => disconnect()}>
         {address?.slice(0, 6)}...{address?.slice(-4)}
       </Button>
     );
   }
   ```

4. **Update AppShell.tsx** to use IdioWalletButton instead of SimpleWalletButton

### **Phase 3: Update Account Management** 
5. **Update AccountManager.tsx**:
   ```typescript
   import { useAccount } from "@starknet-react/core";
   
   export const AccountManager = ({ onAccountSelected }) => {
     const { address: walletAddress } = useAccount(); // Instead of useWallet hook
     // Rest of component stays the same
   }
   ```

### **Phase 4: Update Pages**
6. **Update account-system/page.tsx**:
   - Remove custom event listeners for `walletConnected`
   - Use `useAccount` hook instead
   - Remove custom wallet state management

7. **Update simple-test/page.tsx**:
   - Replace `useWallet` with `useAccount`

### **Phase 5: Cleanup Legacy Code**
8. **Delete legacy files**:
   - `/src/components/WalletConnect.tsx`
   - `/src/components/SimpleWalletButton.tsx` 
   - `/src/lib/wallet.ts`
   - `/src/hooks/useWallet.ts`

9. **Remove custom TypeScript types**:
   - `WalletConnection` interface in `/src/lib/types.ts`

---

## 🔗 **Integration Points**

### **Components That Will Be Affected**:
- ✅ **AppShell** - Header wallet button
- ✅ **AccountManager** - Account creation needs wallet address
- ✅ **All test pages** - Wallet connection status
- ✅ **Account-system page** - Proof generation needs wallet

### **State That Will Change**:
- ❌ **Remove**: Custom localStorage management
- ❌ **Remove**: Custom DOM events (`walletConnected`, `walletDisconnected`)
- ❌ **Remove**: Custom React state for wallet connection
- ✅ **Use**: StarknetKit's built-in state management

### **Benefits After Migration**:
- 🎯 **Single wallet state** - Connect once, connected everywhere
- 🔄 **Automatic reconnection** - No custom logic needed
- 🧹 **Simpler components** - No event listeners or custom state
- 🛡️ **Type safety** - Official starknet-react types
- 📱 **Better UX** - Consistent wallet state across app

---

## ⚠️ **Testing Plan**

### **Before Migration (Current Issues)**:
- [ ] Connect with header button → simple-test page shows disconnected
- [ ] Connect with simple-test button → header shows disconnected  
- [ ] Can have "two different wallets" connected simultaneously

### **After Migration (Expected Behavior)**:
- [ ] Connect with any button → All components show connected
- [ ] Disconnect from any component → All components show disconnected
- [ ] Page refresh → Auto-reconnect works globally
- [ ] Single wallet state across entire application

---

## 🎯 **Success Criteria**

✅ **Migration Complete When**:
1. Only one wallet connection system exists
2. All components use official starknet-react hooks
3. No custom wallet state management code
4. Connect button in header syncs with all pages
5. Account creation works with unified wallet state
6. All legacy wallet files deleted

**Estimated Time**: 2-3 hours
**Risk Level**: Medium (touches many components)
**Priority**: High (blocks proper account management)

---

## 📚 **References**

- [StarknetKit Official Docs](https://www.starknetkit.com/docs/latest/getting-started/usage)
- [Starknet React Hooks](https://starknet-react.com/docs/hooks/account)
- [Current WalletConnect Component](./frontend/src/components/WalletConnect.tsx)
- [Current WalletManager](./frontend/src/lib/wallet.ts)