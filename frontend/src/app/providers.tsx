"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { connect, disconnect } from "starknetkit";
import { InjectedConnector } from "starknetkit/injected";
import { WebWalletConnector } from "starknetkit/webwallet";

// Create wallet context for idiomatic starknetkit usage
interface WalletContextType {
  account: any;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

const WalletContext = React.createContext<WalletContextType | undefined>(undefined);

// Configure connectors once at app level (idiomatic pattern)
const connectors = [
  new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
  new InjectedConnector({ options: { id: "keplr", name: "Keplr" } }),
  new InjectedConnector({ options: { id: "metamask", name: "MetaMask Snap" } }),
  new InjectedConnector({ options: { id: "okxwallet", name: "OKX Wallet" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
];

function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = React.useState<any>(null);
  const [address, setAddress] = React.useState<string | null>(null);
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Auto-reconnect on mount
  React.useEffect(() => {
    const autoReconnect = async () => {
      try {
        const { wallet, connectorData } = await connect({
          modalMode: "neverAsk", // Silent reconnect
          connectors,
        });

        if (wallet && connectorData) {
          setAccount(wallet);
          setAddress(connectorData.account || "");
        }
      } catch (error) {
        console.log("No previous connection found");
      }
    };

    autoReconnect();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { wallet, connectorData } = await connect({
        modalMode: "alwaysAsk",
        connectors,
        dappName: "Private DAI Transfer",
      });

      if (wallet && connectorData) {
        setAccount(wallet);
        setAddress(connectorData.account || "");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({ clearLastWallet: true });
      setAccount(null);
      setAddress(null);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const value: WalletContextType = {
    account,
    address,
    isConnected: !!account,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isConnecting,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// Hook for components to use wallet
export function useWalletContext() {
  const context = React.useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }
  return context;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </WalletProvider>
  );
}
