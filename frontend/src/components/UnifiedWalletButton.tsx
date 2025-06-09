'use client';

import { Button } from "@inkonchain/ink-kit";
import { useWalletContext } from '@/app/providers';

export function UnifiedWalletButton() {
  const { isConnected, address, connect, disconnect, isConnecting } = useWalletContext();

  if (!isConnected) {
    return (
      <Button 
        variant="primary"
        onClick={connect}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  const shortAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <Button 
      variant="secondary"
      onClick={disconnect}
    >
      {shortAddress}
    </Button>
  );
}