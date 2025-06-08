import { Card, Typography, Button } from "@inkonchain/ink-kit";
import Link from "next/link";

export default function Home() {
  return (
    <div className="ink:max-w-4xl ink:mx-auto ink:p-6 ink:space-y-8">
      <div className="ink:text-center ink:space-y-4">
        <Typography variant="h1">
          Private DAI Transfer
        </Typography>
        <Typography variant="subtitle-1" className="ink:text-muted">
          Transfer DAI tokens privately on Starknet using zero-knowledge proofs
        </Typography>
      </div>

      <div className="ink:grid ink:grid-cols-1 md:ink:grid-cols-2 ink:gap-6">
        <Card className="ink:p-6 ink:space-y-4">
          <Typography variant="h3">
            Account System
          </Typography>
          <Typography variant="body-1" className="ink:text-muted">
            Starknet-native implementation with account abstraction. High privacy with efficient gas costs and better throughput.
          </Typography>
          <Link href="/account-system">
            <Button variant="primary" className="ink:w-full">
              Explore Account System
            </Button>
          </Link>
        </Card>

        <Card className="ink:p-6 ink:space-y-4">
          <Typography variant="h3">
            Commitment System
          </Typography>
          <Typography variant="body-1" className="ink:text-muted">
            Maximum privacy implementation inspired by Bitcoin/Zcash. Complete unlinkability with UTXO-style ephemeral commitments.
          </Typography>
          <Link href="/commitment-system">
            <Button variant="primary" className="ink:w-full">
              Explore Commitment System
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="ink:p-6 ink:space-y-4">
        <Typography variant="h3">
          Security Features
        </Typography>
        <div className="ink:grid ink:grid-cols-1 md:ink:grid-cols-2 ink:gap-4">
          <div>
            <Typography variant="body-1" className="ink:font-medium">Anti-Rug Protection</Typography>
            <Typography variant="body-1" className="ink:text-muted">
              Interactive protocols prevent senders from stealing funds
            </Typography>
          </div>
          <div>
            <Typography variant="body-1" className="ink:font-medium">Client-side Proofs</Typography>
            <Typography variant="body-1" className="ink:text-muted">
              Data privacy ensured through local proof generation
            </Typography>
          </div>
          <div>
            <Typography variant="body-1" className="ink:font-medium">Nullifier System</Typography>
            <Typography variant="body-1" className="ink:text-muted">
              Prevents double-spending with cryptographic nullifiers
            </Typography>
          </div>
          <div>
            <Typography variant="body-1" className="ink:font-medium">Merkle Verification</Typography>
            <Typography variant="body-1" className="ink:text-muted">
              Prevents fake balance attacks using Merkle trees
            </Typography>
          </div>
        </div>
      </Card>
    </div>
  );
}
