'use client';

import { useEffect, useState } from 'react';
import { connect, disconnect } from 'starknetkit';
import { WebWalletConnector } from 'starknetkit/webwallet';
import { InjectedConnector } from 'starknetkit/injected';
import { Typography, Card, Button } from "@inkonchain/ink-kit";

export function WalletConnect() {
  const [address, setAddress] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Ensure client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    if (!isClient) return;
    
    const reconnect = async () => {
      try {
        // Try to reconnect silently if previously connected
        const { wallet, connectorData } = await connect({ 
          modalMode: "neverAsk",
          modalTheme: "system",
        });
        
        if (wallet && connectorData) {
          setAddress(connectorData.account || '');
          
          // Trigger event to notify other components
          window.dispatchEvent(new CustomEvent('walletConnected', { 
            detail: { 
              address: connectorData.account,
              wallet: wallet 
            } 
          }));
        }
      } catch (error) {
        console.log('No previous connection found');
      }
    };
    
    reconnect();
  }, [isClient]);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Configure connectors with proper order
      const connectors = [
        new InjectedConnector({
          options: { id: "argentX", name: "Argent X" },
        }),
        new InjectedConnector({
          options: { id: "braavos", name: "Braavos" },
        }),
        new WebWalletConnector({ url: "https://web.argent.xyz" }),
        // Note: Keplr and MetaMask are not Starknet wallets
        // StarknetKit supports Argent X, Braavos, and Argent Web Wallet
      ];

      const { wallet, connectorData } = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'system',
        connectors: connectors,
        dappName: 'Private DAI Transfer',
      });

      if (wallet && connectorData) {
        const walletAddress = connectorData.account || '';
        setAddress(walletAddress);
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('walletConnected', { 
          detail: { 
            address: walletAddress,
            wallet: wallet 
          } 
        }));
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect({ clearLastWallet: true });
      setAddress('');
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  if (!isClient) {
    return (
      <Card className="p-4">
        <Typography variant="body-2-regular">Loading...</Typography>
      </Card>
    );
  }

  if (!address) {
    return (
      <Card className="p-4 space-y-3">
        <Typography variant="h3">Connect Wallet</Typography>
        <Typography variant="body-2-regular">
          Connect your Starknet wallet to start making private transfers
        </Typography>
        <Button 
          variant="primary"
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect Starknet Wallet'}
        </Button>
        <Typography variant="caption-1-regular" className="text-center ink:text-muted">
          Supports ArgentX, Braavos, and Argent Web Wallet
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="body-1">Connected</Typography>
          <Typography variant="body-2-regular" className="font-mono">
            {`${address.slice(0, 6)}...${address.slice(-4)}`}
          </Typography>
        </div>
        <Button 
          variant="secondary"
          size="md"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    </Card>
  );
}