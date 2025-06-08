import { Card, Typography, Button, Input } from "@inkonchain/ink-kit";

export default function AccountSystemPage() {
  return (
    <div className="ink:max-w-6xl ink:mx-auto ink:p-6 ink:space-y-8">
      <div className="ink:space-y-4">
        <Typography variant="h1">
          Account System
        </Typography>
        <Typography variant="subtitle-1" className="ink:text-muted">
          Starknet-native implementation with account abstraction for high privacy and efficiency
        </Typography>
      </div>

      <div className="ink:grid ink:grid-cols-1 lg:ink:grid-cols-2 ink:gap-6">
        <div className="ink:space-y-6">
          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              System Overview
            </Typography>
            <div className="ink:space-y-3">
              <div>
                <Typography variant="body-1" className="ink:font-medium">Privacy Level</Typography>
                <Typography variant="body-2" className="ink:text-muted">
                  High privacy with some linkability patterns
                </Typography>
              </div>
              <div>
                <Typography variant="body-1" className="ink:font-medium">Efficiency</Typography>
                <Typography variant="body-2" className="ink:text-muted">
                  More efficient, lower gas costs, better for high throughput
                </Typography>
              </div>
              <div>
                <Typography variant="body-1" className="ink:font-medium">Model</Typography>
                <Typography variant="body-2" className="ink:text-muted">
                  Persistent accounts with hidden balances
                </Typography>
              </div>
            </div>
          </Card>

          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              Technical Details
            </Typography>
            <div className="ink:space-y-2">
              <Typography variant="body-2">
                • Account abstraction compatible
              </Typography>
              <Typography variant="body-2">
                • Optimized for Starknet native features
              </Typography>
              <Typography variant="body-2">
                • Interactive transfer protocols
              </Typography>
              <Typography variant="body-2">
                • Zero-knowledge balance verification
              </Typography>
            </div>
          </Card>
        </div>

        <div className="ink:space-y-6">
          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              Transfer Interface
            </Typography>
            <div className="ink:space-y-4">
              <div>
                <Typography variant="body-2" className="ink:font-medium ink:mb-2">
                  Recipient Address
                </Typography>
                <Input 
                  placeholder="Connect wallet to enable transfers"
                  disabled
                  variant="secondary"
                />
              </div>
              <div>
                <Typography variant="body-2" className="ink:font-medium ink:mb-2">
                  Amount (DAI)
                </Typography>
                <Input 
                  placeholder="Enter amount"
                  disabled
                  variant="secondary"
                />
              </div>
              <Button variant="primary" className="ink:w-full" disabled>
                Generate Private Transfer
              </Button>
            </div>
          </Card>

          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              Account Status
            </Typography>
            <div className="ink:space-y-2">
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Balance:</Typography>
                <Typography variant="body-2" className="ink:font-mono">---.-- DAI</Typography>
              </div>
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Account:</Typography>
                <Typography variant="body-2" className="ink:font-mono">Not connected</Typography>
              </div>
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Nullifier:</Typography>
                <Typography variant="body-2" className="ink:font-mono">--</Typography>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="ink:p-6">
        <Typography variant="h3" className="ink:mb-4">
          How It Works
        </Typography>
        <div className="ink:grid ink:grid-cols-1 md:ink:grid-cols-3 ink:gap-6">
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">1. Account Setup</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Create persistent private account with hidden balance commitment
            </Typography>
          </div>
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">2. Transfer Request</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Recipient generates secret commitment for receiving funds
            </Typography>
          </div>
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">3. Proof Generation</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Generate ZK proof of balance and transfer validity
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
}