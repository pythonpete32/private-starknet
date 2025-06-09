'use client';

import { Button } from "@inkonchain/ink-kit";
import { useWallet } from '@/hooks/useWallet';

export function SimpleWalletButton() {
  const { isConnected, shortAddress, connect, disconnect, isConnecting } = useWallet();

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

  return (
    <Button 
      variant="secondary"
      onClick={disconnect}
    >
      {shortAddress}
    </Button>
  );
}