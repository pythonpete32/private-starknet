import { Card, Typography, Button, Input } from "@inkonchain/ink-kit";

export default function CommitmentSystemPage() {
  return (
    <div className="ink:max-w-6xl ink:mx-auto ink:p-6 ink:space-y-8">
      <div className="ink:space-y-4">
        <Typography variant="h1">
          Commitment System
        </Typography>
        <Typography variant="subtitle-1" className="ink:text-muted">
          Maximum privacy implementation with complete unlinkability inspired by Bitcoin/Zcash
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
                  Complete unlinkability, maximum privacy guarantees
                </Typography>
              </div>
              <div>
                <Typography variant="body-1" className="ink:font-medium">Efficiency</Typography>
                <Typography variant="body-2" className="ink:text-muted">
                  Higher overhead but stronger privacy
                </Typography>
              </div>
              <div>
                <Typography variant="body-1" className="ink:font-medium">Model</Typography>
                <Typography variant="body-2" className="ink:text-muted">
                  UTXO-style ephemeral commitments
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
                • UTXO-based commitment model
              </Typography>
              <Typography variant="body-2">
                • Merkle tree inclusion proofs
              </Typography>
              <Typography variant="body-2">
                • Ephemeral commitment generation
              </Typography>
              <Typography variant="body-2">
                • Maximum unlinkability guarantees
              </Typography>
            </div>
          </Card>
        </div>

        <div className="ink:space-y-6">
          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              Commitment Interface
            </Typography>
            <div className="ink:space-y-4">
              <div>
                <Typography variant="body-2" className="ink:font-medium ink:mb-2">
                  New Commitment Value
                </Typography>
                <Input 
                  placeholder="Enter DAI amount for commitment"
                  disabled
                  variant="secondary"
                />
              </div>
              <div>
                <Typography variant="body-2" className="ink:font-medium ink:mb-2">
                  Recipient Commitment
                </Typography>
                <Input 
                  placeholder="Paste recipient's commitment hash"
                  disabled
                  variant="secondary"
                />
              </div>
              <Button variant="primary" className="ink:w-full" disabled>
                Generate Private Commitment
              </Button>
            </div>
          </Card>

          <Card className="ink:p-6 ink:space-y-4">
            <Typography variant="h3">
              Merkle Tree Status
            </Typography>
            <div className="ink:space-y-2">
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Tree Root:</Typography>
                <Typography variant="body-2" className="ink:font-mono">0x--...--</Typography>
              </div>
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Total Commitments:</Typography>
                <Typography variant="body-2" className="ink:font-mono">---</Typography>
              </div>
              <div className="ink:flex ink:justify-between">
                <Typography variant="body-2">Tree Depth:</Typography>
                <Typography variant="body-2" className="ink:font-mono">20</Typography>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="ink:p-6">
        <Typography variant="h3" className="ink:mb-4">
          How It Works
        </Typography>
        <div className="ink:grid ink:grid-cols-1 md:ink:grid-cols-4 ink:gap-6">
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">1. Commitment Creation</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Generate ephemeral commitment with secret value and randomness
            </Typography>
          </div>
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">2. Tree Inclusion</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Add commitment to global Merkle tree for verification
            </Typography>
          </div>
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">3. Transfer Proof</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Prove knowledge of commitment without revealing details
            </Typography>
          </div>
          <div className="ink:space-y-2">
            <Typography variant="body-1" className="ink:font-medium">4. Nullifier</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Generate unique nullifier to prevent double-spending
            </Typography>
          </div>
        </div>
      </Card>

      <Card className="ink:p-6">
        <Typography variant="h3" className="ink:mb-4">
          Privacy Advantages
        </Typography>
        <div className="ink:grid ink:grid-cols-1 md:ink:grid-cols-2 ink:gap-6">
          <div className="ink:space-y-3">
            <Typography variant="body-1" className="ink:font-medium">Complete Unlinkability</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              No connection between sender and recipient addresses, amounts, or timing
            </Typography>
          </div>
          <div className="ink:space-y-3">
            <Typography variant="body-1" className="ink:font-medium">Anonymous Set</Typography>
            <Typography variant="body-2" className="ink:text-muted">
              Each transaction hides among all previous commitments in the tree
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
}