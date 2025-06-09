import type { WalletConnection } from "./types";

export class WalletManager {
  private static connection: WalletConnection | null = null;

  static async connectWallet(): Promise<WalletConnection | null> {
    if (typeof window === 'undefined') return null;
    
    try {
      console.log("Connecting to Starknet wallet...");

      // Dynamic import for client-side only
      const { connect } = await import("starknetkit");
      
      const { wallet, connectorData } = await connect({
        modalMode: "alwaysAsk",
        modalTheme: "system",
        webWalletUrl: "https://web.argent.xyz",
      });

      if (wallet && connectorData) {
        const walletConnection: WalletConnection = {
          account: wallet,
          address: connectorData.account || "",
          provider: wallet,
        };

        this.connection = walletConnection;
        console.log("Wallet connected successfully:", walletConnection.address);

        // Store connection in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("wallet_connected", "true");
          localStorage.setItem("wallet_address", walletConnection.address);
        }

        return walletConnection;
      }

      console.log("Wallet connection failed or cancelled");
      return null;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return null;
    }
  }

  static async disconnectWallet(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Dynamic import for client-side only
      const { disconnect } = await import("starknetkit");
      await disconnect({ clearLastWallet: true });
      this.connection = null;

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet_connected");
        localStorage.removeItem("wallet_address");
      }

      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }

  static getConnection(): WalletConnection | null {
    return this.connection;
  }

  static isConnected(): boolean {
    return this.connection !== null;
  }

  static getAddress(): string | null {
    return this.connection?.address || null;
  }

  // Check if wallet was previously connected (for persistence across page reloads)
  static wasConnected(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("wallet_connected") === "true";
  }

  static getStoredAddress(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("wallet_address");
  }

  // Auto-reconnect if wallet was previously connected
  static async autoReconnect(): Promise<WalletConnection | null> {
    if (typeof window === 'undefined' || !this.wasConnected()) return null;

    try {
      // Dynamic import for client-side only
      const { connect } = await import("starknetkit");
      
      // Try to reconnect silently
      const { wallet, connectorData } = await connect({
        modalMode: "neverAsk", // Silent reconnect
        webWalletUrl: "https://web.argent.xyz",
      });

      if (wallet && connectorData) {
        const walletConnection: WalletConnection = {
          account: wallet,
          address: connectorData.account || "",
          provider: wallet,
        };

        this.connection = walletConnection;
        console.log("Wallet auto-reconnected:", walletConnection.address);
        return walletConnection;
      }
    } catch (error) {
      console.warn("Auto-reconnect failed:", error);
      // Clear stored connection data if auto-reconnect fails
      this.disconnectWallet();
    }

    return null;
  }

  // Get wallet info for display
  static getWalletInfo(): {
    isConnected: boolean;
    address: string | null;
    shortAddress: string | null;
  } {
    const address = this.getAddress();
    return {
      isConnected: this.isConnected(),
      address,
      shortAddress: address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : null,
    };
  }
}
