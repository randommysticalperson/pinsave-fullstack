import { useState } from "react";
import { useLocation } from "wouter";
import { ExternalLinkIcon, UserIcon } from "lucide-react";
import type { NftToken } from "../../../server/near";
import { useNear } from "@/contexts/NearContext";

interface PinCardProps {
  token: NftToken;
}

function resolveMediaUrl(media?: string | null): string {
  if (!media) return "";
  if (media.startsWith("http")) return media;
  if (media.startsWith("ipfs://")) {
    const cid = media.replace("ipfs://", "");
    return `https://${cid}.ipfs.dweb.link/`;
  }
  return media;
}

export function PinCard({ token }: PinCardProps) {
  const { nearConfig } = useNear();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { metadata, token_id, owner_id } = token;
  const mediaUrl = resolveMediaUrl(metadata.media);
  const title = metadata.title || "Untitled";
  const explorerUrl = nearConfig
    ? `${nearConfig.explorerUrl}/nfts/${nearConfig.contractName}/${token_id}`
    : "#";

  const shortOwner =
    owner_id.length > 16
      ? owner_id.slice(0, 8) + "…" + owner_id.slice(-5)
      : owner_id;

  const [, navigate] = useLocation();

  return (
    <div className="masonry-item">
      <div
        className="pin-card group cursor-pointer"
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/pin/${token_id}`)}
        onKeyDown={(e) => e.key === "Enter" && navigate(`/pin/${token_id}`)}
      >
          {/* Image */}
          {!imgLoaded && !imgError && (
            <div className="skeleton w-full" style={{ paddingBottom: "120%" }} />
          )}
          {mediaUrl && !imgError ? (
            <img
              src={mediaUrl}
              alt={title}
              className={`w-full object-cover transition-opacity duration-300 ${
                imgLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full flex items-center justify-center bg-muted text-muted-foreground"
              style={{ minHeight: "180px" }}
            >
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Overlay */}
          <div className="pin-overlay" />

          {/* Info footer (visible on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200 ease-out z-10">
            <p className="text-white text-sm font-semibold leading-tight line-clamp-2 mb-1">
              {title}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <UserIcon className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{shortOwner}</span>
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white/60 hover:text-white transition-colors"
                title="View on NEAR Explorer"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
    </div>
  );
}

// Skeleton card for loading state
export function PinCardSkeleton() {
  const heights = [180, 240, 200, 280, 160, 220];
  const h = heights[Math.floor(Math.random() * heights.length)];
  return (
    <div className="masonry-item">
      <div className="skeleton rounded-xl" style={{ height: `${h}px` }} />
    </div>
  );
}
