'use client';

import { Typography, Button, Card } from "@inkonchain/ink-kit";
import { useWallet } from '../hooks/useWallet';

export function WalletConnect() {
  const { 
    isConnected, 
    shortAddress, 
    isLoading, 
    isConnecting, 
    connect, 
    disconnect 
  } = useWallet();

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin h-4 w-4 border-2 ink:bg-button-primary rounded-full"></div>
          <Typography variant="body-2-regular">Loading wallet...</Typography>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="p-4 space-y-3">
        <Typography variant="h3">Connect Wallet</Typography>
        <Typography variant="body-2-regular">
          Connect your Starknet wallet to start making private transfers
        </Typography>
        <Button 
          variant="primary" 
          className="w-full"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Starknet Wallet'}
        </Button>
        <Typography variant="caption-1-regular" className="text-center">
          Supports ArgentX, Braavos, and Argent Web Wallet
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="body-1">Wallet Connected</Typography>
          <Typography variant="body-2-regular" className="font-mono">
            {shortAddress}
          </Typography>
        </div>
        <div className="flex items-center space-x-2">
          <Typography variant="caption-1-regular">
            Connected
          </Typography>
        </div>
      </div>
      
      <Button 
        variant="secondary" 
        className="w-full"
        onClick={disconnect}
      >
        Disconnect Wallet
      </Button>
    </Card>
  );
}