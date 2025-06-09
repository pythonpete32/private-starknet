import { Card, Typography, Button } from "@inkonchain/ink-kit";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero - Clean and focused */}
      <div className="text-center mb-20">
        <Typography variant="h1" className="mb-6">
          Private DAI Transfers
        </Typography>
        <Typography variant="h5">
          Send DAI privately on Starknet using zero-knowledge proofs
        </Typography>
      </div>

      {/* System Selection - Proper card usage like Storybook examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Account System Card */}
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <Typography variant="h2">Account System</Typography>
              <Typography variant="body-1" className="text-accent font-medium">
                Recommended
              </Typography>
              <Typography variant="body-1" className="opacity-60">
                Efficient gas costs with Starknet-native account abstraction
              </Typography>
            </div>

            <Link href="/account-system">
              <Button variant="primary" className="w-full py-4">
                Start Here
              </Button>
            </Link>
          </div>
        </Card>

        {/* Commitment System Card */}
        <Card className="p-8">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <Typography variant="h2">Commitment System</Typography>
              <Typography variant="body-1" className="text-accent font-medium">
                Maximum Privacy
              </Typography>
              <Typography variant="body-1" className="opacity-60">
                Complete unlinkability for maximum anonymity
              </Typography>
            </div>

            <Link href="/commitment-system">
              <Button variant="secondary" className="w-full py-4">
                Try This
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick steps - Subtle */}
      <div className="text-center opacity-60">
        <Typography variant="body-2-regular" className="text-muted">
          Connect wallet → Choose system → Transfer privately
        </Typography>
      </div>
    </div>
  );
}
