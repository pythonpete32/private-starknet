"use client";

import { useState } from "react";
import { Button, Card, Typography, Popover } from "@inkonchain/ink-kit";
import { useWallet } from "../../hooks/useWallet";

export function WalletDropdown() {
  const { isConnected, shortAddress, address, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      // Could add a toast notification here
    }
  };

  if (!isConnected) {
    return (
      <Button variant="primary" size="md" onClick={connect}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant="secondary" 
        size="md" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <div className="w-6 h-6 ink:bg-button-primary rounded-full flex items-center justify-center">
          <span className="text-xs ink:text-text-on-primary">👤</span>
        </div>
        <span className="font-mono">{shortAddress}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-80 p-4 space-y-4">
            {/* Header with avatar and address */}
            <div className="flex items-center gap-3 p-3 border-b">
              <div className="w-10 h-10 ink:bg-button-primary rounded-full flex items-center justify-center">
                <span className="ink:text-text-on-primary">👤</span>
              </div>
              <div>
                <Typography variant="body-2-bold">{shortAddress}</Typography>
              </div>
            </div>

            {/* Balance section */}
            <div className="space-y-3">
              <Typography variant="body-2-bold">Balance</Typography>
              <Card variant="secondary" className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <span>⧫</span>
                  <Typography variant="h4">0 ETH</Typography>
                </div>
                <Button variant="primary" size="md">
                  ↓
                </Button>
              </Card>
            </div>

            {/* Copy address */}
            <Button 
              variant="transparent" 
              className="w-full justify-start gap-2" 
              onClick={copyAddress}
            >
              📋 <span className="font-mono">{shortAddress}</span>
            </Button>

            {/* Disconnect */}
            <Button 
              variant="transparent" 
              className="w-full justify-start gap-2 ink:text-status-error" 
              onClick={disconnect}
            >
              🔌 Disconnect
            </Button>
          </Card>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}