import { trpc } from "@/lib/trpc";
import { useNear } from "@/contexts/NearContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  UserIcon,
  HashIcon,
  CalendarIcon,
  CopyIcon,
  CheckIcon,
  ImageOffIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function resolveMediaUrl(media?: string | null): string {
  if (!media) return "";
  if (media.startsWith("http")) return media;
  if (media.startsWith("ipfs://")) {
    const cid = media.replace("ipfs://", "");
    return `https://${cid}.ipfs.dweb.link/`;
  }
  return media;
}

interface MetaRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
  link?: string;
}

function MetaRow({ icon, label, value, mono, copyable, link }: MetaRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm text-primary hover:underline break-all ${mono ? "font-mono" : ""}`}
          >
            {value}
          </a>
        ) : (
          <p className={`text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</p>
        )}
      </div>
      {copyable && (
        <button
          onClick={handleCopy}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          title="Copy"
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-primary" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export default function PinDetail({ params }: { params: { tokenId: string } }) {
  const { nearConfig } = useNear();
  const tokenId = params.tokenId;

  const { data: token, isLoading, isError } = trpc.pins.byId.useQuery(
    { tokenId },
    { enabled: !!tokenId }
  );

  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <div className="skeleton h-8 w-32 rounded-full mb-8" />
          <div className="grid md:grid-cols-2 gap-10">
            <div className="skeleton rounded-2xl" style={{ paddingBottom: "100%" }} />
            <div className="flex flex-col gap-4">
              <div className="skeleton h-8 w-3/4 rounded-lg" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !token) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center fade-in">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <ImageOffIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-display font-semibold mb-2">Pin not found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This token may not exist on the current contract.
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2 rounded-full">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { metadata, owner_id, token_id } = token;
  const mediaUrl = resolveMediaUrl(metadata.media);
  const title = metadata.title || "Untitled";

  // Extract CID from extra or media
  let cid = "";
  if (metadata.extra) {
    try {
      const extra = JSON.parse(metadata.extra);
      cid = extra.cid || "";
    } catch {}
  }
  if (!cid && metadata.media?.startsWith("ipfs://")) {
    cid = metadata.media.replace("ipfs://", "").split("/")[0];
  }

  const explorerUrl = nearConfig
    ? `${nearConfig.explorerUrl}/nfts/${nearConfig.contractName}/${token_id}`
    : null;
  const ipfsUrl = cid ? `https://${cid}.ipfs.dweb.link/` : null;

  return (
    <div className="container py-10 fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 rounded-full mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Image */}
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            {mediaUrl && !imgError ? (
              <img
                src={mediaUrl}
                alt={title}
                className="w-full object-contain max-h-[600px]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
                <ImageOffIcon className="h-12 w-12 opacity-30" />
              </div>
            )}
          </div>

          {/* Metadata */}
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold mb-3 leading-tight">
              {title}
            </h1>

            {metadata.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {metadata.description}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {explorerUrl && (
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    NEAR Explorer
                  </Button>
                </a>
              )}
              {ipfsUrl && (
                <a href={ipfsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    View on IPFS
                  </Button>
                </a>
              )}
            </div>

            <Separator className="mb-2" />

            {/* Metadata rows */}
            <div className="divide-y divide-border/50">
              <MetaRow
                icon={<HashIcon className="h-4 w-4" />}
                label="Token ID"
                value={token_id}
                mono
                copyable
              />
              <MetaRow
                icon={<UserIcon className="h-4 w-4" />}
                label="Owner"
                value={owner_id}
                mono
                copyable
              />
              {cid && (
                <MetaRow
                  icon={<ExternalLinkIcon className="h-4 w-4" />}
                  label="IPFS CID"
                  value={cid}
                  mono
                  copyable
                  link={ipfsUrl ?? undefined}
                />
              )}
              {nearConfig && (
                <MetaRow
                  icon={<HashIcon className="h-4 w-4" />}
                  label="Contract"
                  value={nearConfig.contractName}
                  mono
                  link={explorerUrl ?? undefined}
                />
              )}
              {metadata.issued_at && (
                <MetaRow
                  icon={<CalendarIcon className="h-4 w-4" />}
                  label="Minted"
                  value={new Date(parseInt(metadata.issued_at) / 1_000_000).toLocaleDateString()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
