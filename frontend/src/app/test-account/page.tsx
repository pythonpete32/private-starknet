'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Alert } from '@inkonchain/ink-kit';
import { AccountManager } from '@/components/AccountManager';
import { PrivateAccount } from '@/lib/accountStorage';

export default function TestAccountPage() {
  const [selectedAccount, setSelectedAccount] = useState<PrivateAccount | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <Typography variant="h1">Account System Test</Typography>
        <Typography variant="body-1">
          Simple test page to verify account persistence works.
        </Typography>
      </div>

      {/* Test Instructions */}
      <Card variant="light-purple" className="p-6">
        <Typography variant="h3" className="mb-4">Testing Steps</Typography>
        <div className="space-y-2">
          <Typography variant="body-2-regular">
            1. Connect your Starknet wallet
          </Typography>
          <Typography variant="body-2-regular">
            2. Click "Create New Account" below
          </Typography>
          <Typography variant="body-2-regular">
            3. Refresh this page (F5)
          </Typography>
          <Typography variant="body-2-regular">
            4. Verify the account still appears after refresh ✅
          </Typography>
        </div>
      </Card>

      {/* Account Manager */}
      <AccountManager onAccountSelected={setSelectedAccount} />

      {/* Selected Account Display */}
      {selectedAccount && (
        <Alert
          variant="success"
          title="Account Selected!"
          description={`✅ Account persisted with balance: ${selectedAccount.balance} DAI. Secret key: ${selectedAccount.secretKey.slice(0, 10)}...`}
        />
      )}

      {/* Test Results */}
      <Card className="p-6">
        <Typography variant="h4" className="mb-4">Test Results</Typography>
        <div className="space-y-2">
          <Typography variant="body-2-regular">
            Selected Account: {selectedAccount ? '✅ Yes' : '❌ None'}
          </Typography>
          <Typography variant="body-2-regular">
            Secret Key Length: {selectedAccount ? `✅ ${selectedAccount.secretKey.length} chars` : '❌ N/A'}
          </Typography>
          <Typography variant="body-2-regular">
            Is Secure Key: {selectedAccount?.secretKey !== '12345' ? '✅ Yes (not 12345)' : '❌ Still using demo key'}
          </Typography>
        </div>
      </Card>
    </div>
  );
}