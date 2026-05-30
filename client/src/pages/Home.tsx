import { trpc } from "@/lib/trpc";
import { PinCard, PinCardSkeleton } from "@/components/PinCard";
import { Button } from "@/components/ui/button";
import { useNear } from "@/contexts/NearContext";
import { Link } from "wouter";
import { UploadIcon, RefreshCwIcon, ImageOffIcon, ZapIcon } from "lucide-react";

const SKELETON_COUNT = 12;

export default function Home() {
  const { nearConfig } = useNear();

  const {
    data: tokens,
    isLoading,
    isError,
    refetch,
  } = trpc.pins.list.useQuery(
    { limit: 50 },
    {
      enabled: true,
      staleTime: 30_000,
    }
  );

  return (
    <div className="container py-8">
      {/* Hero header */}
      <div className="mb-8 fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold mb-2">
              Discover Pins
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md">
              A decentralized pinboard powered by{" "}
              <span className="text-primary font-medium">NEAR Protocol</span> and{" "}
              <span className="text-primary font-medium">IPFS</span>. Every pin is an NFT you truly own.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {nearConfig && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border/60 font-mono">
                {nearConfig.networkId}
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

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 fade-in">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ImageOffIcon className="h-8 w-8 text-destructive" />
          </div>
          <div className="text-center">
            <p className="font-semibold mb-1">Could not load pins</p>
            <p className="text-sm text-muted-foreground mb-4">
              Check your NEAR contract configuration in Settings.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCwIcon className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !isError && (
        <div className="masonry-grid">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <PinCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tokens?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-6 fade-in">
          <div className="relative">
            <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center">
              <ZapIcon className="h-12 w-12 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary animate-bounce" />
          </div>
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-display font-semibold mb-2">No pins yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Be the first to mint a pin on this contract. Connect your NEAR wallet and upload an image to get started.
            </p>
            <Link href="/upload">
              <Button className="btn-glow gap-2 rounded-full">
                <UploadIcon className="h-4 w-4" />
                Mint the first pin
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Masonry grid */}
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
