'use client';

import { useState, useEffect } from 'react';
import { WalletManager } from '../lib/wallet';
import type { WalletConnection } from '../lib/types';

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-reconnect on mount
  useEffect(() => {
    async function tryAutoReconnect() {
      setIsLoading(true);
      try {
        const reconnectedWallet = await WalletManager.autoReconnect();
        if (reconnectedWallet) {
          setConnection(reconnectedWallet);
        }
      } catch (error) {
        console.warn('Auto-reconnect failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    tryAutoReconnect();
  }, []);

  const connect = async (): Promise<boolean> => {
    if (isConnecting) return false;
    
    setIsConnecting(true);
    try {
      const walletConnection = await WalletManager.connectWallet();
      if (walletConnection) {
        setConnection(walletConnection);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connect failed:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      await WalletManager.disconnectWallet();
      setConnection(null);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const walletInfo = WalletManager.getWalletInfo();

  return {
    // Connection state
    connection,
    isConnected: walletInfo.isConnected,
    address: walletInfo.address,
    shortAddress: walletInfo.shortAddress,
    
    // Loading states
    isLoading,
    isConnecting,
    
    // Actions
    connect,
    disconnect,
    
    // Utility
    account: connection?.account,
    provider: connection?.provider,
  };
}