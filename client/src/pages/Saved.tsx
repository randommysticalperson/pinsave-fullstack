import { trpc } from "@/lib/trpc";
import { PinCard, PinCardSkeleton } from "@/components/PinCard";
import { Button } from "@/components/ui/button";
import { useNear } from "@/contexts/NearContext";
import { Link } from "wouter";
import { UploadIcon, WalletIcon, BookmarkIcon, RefreshCwIcon } from "lucide-react";

export default function Saved() {
  const { isConnected, accountId, connect } = useNear();

  const {
    data: tokens,
    isLoading,
    isError,
    refetch,
  } = trpc.pins.byOwner.useQuery(
    { accountId: accountId ?? "" },
    {
      enabled: !!accountId,
      staleTime: 30_000,
    }
  );

  // Not connected
  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center fade-in">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <WalletIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-3">Connect your wallet</h1>
          <p className="text-muted-foreground mb-8">
            Connect your NEAR wallet to view the pins you own.
          </p>
          <Button onClick={connect} className="btn-glow gap-2 rounded-full" size="lg">
            <WalletIcon className="h-5 w-5" />
            Connect NEAR Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookmarkIcon className="h-5 w-5 text-primary" />
              <h1 className="text-3xl font-display font-semibold">My Pins</h1>
            </div>
            <p className="text-muted-foreground text-sm font-mono truncate max-w-xs">
              {accountId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && tokens && (
              <span className="text-sm text-muted-foreground">
                {tokens.length} {tokens.length === 1 ? "pin" : "pins"}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              className="rounded-full text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 fade-in">
          <p className="text-muted-foreground">Failed to load your pins.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="masonry-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <PinCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && tokens?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-6 fade-in">
          <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center">
            <BookmarkIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-display font-semibold mb-2">No pins yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You haven't minted any pins. Upload an image to create your first NFT pin.
            </p>
            <Link href="/upload">
              <Button className="btn-glow gap-2 rounded-full">
                <UploadIcon className="h-4 w-4" />
                Upload a pin
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && tokens && tokens.length > 0 && (
        <div className="masonry-grid fade-in">
          {tokens.map((token) => (
            <PinCard key={token.token_id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
}
