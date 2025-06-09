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
      <Card className="ink:p-4">
        <div className="ink:flex ink:items-center ink:space-x-3">
          <div className="ink:animate-spin ink:h-4 ink:w-4 ink:border-2 ink:border-gray-300 ink:border-t-blue-600 ink:rounded-full"></div>
          <Typography variant="body-2-regular">Loading wallet...</Typography>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="ink:p-4 ink:space-y-3">
        <Typography variant="h3">Connect Wallet</Typography>
        <Typography variant="body-2-regular" className="ink:text-muted">
          Connect your Starknet wallet to start making private transfers
        </Typography>
        <Button 
          variant="primary" 
          className="ink:w-full"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Starknet Wallet'}
        </Button>
        <Typography variant="caption-1-regular" className="ink:text-muted ink:text-center">
          Supports ArgentX, Braavos, and Argent Web Wallet
        </Typography>
      </Card>
    );
  }

  return (
    <Card className="ink:p-4 ink:space-y-3">
      <div className="ink:flex ink:items-center ink:justify-between">
        <div>
          <Typography variant="body-1" className="ink:font-medium">Wallet Connected</Typography>
          <Typography variant="body-2-regular" className="ink:text-muted ink:font-mono">
            {shortAddress}
          </Typography>
        </div>
        <div className="ink:flex ink:items-center ink:space-x-2">
          <div className="ink:w-2 ink:h-2 ink:bg-green-500 ink:rounded-full"></div>
          <Typography variant="caption-1-regular" className="ink:text-green-600">
            Connected
          </Typography>
        </div>
      </div>
      
      <Button 
        variant="secondary" 
        className="ink:w-full"
        onClick={disconnect}
      >
        Disconnect Wallet
      </Button>
    </Card>
  );
}