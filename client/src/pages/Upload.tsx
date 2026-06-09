import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useNear } from "@/contexts/NearContext";
import { useNftStorageKey } from "@/hooks/useNftStorageKey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  UploadCloudIcon,
  ImageIcon,
  XIcon,
  Loader2Icon,
  WalletIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  KeyRoundIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  Trash2Icon,
} from "lucide-react";

type UploadStep = "idle" | "uploading-ipfs" | "minting" | "done";

export default function Upload() {
  const { isConnected, accountId, connect, callMethod } = useNear();
  const { key: storedKey, hasKey, saveKey, clearKey } = useNftStorageKey();
  const [, navigate] = useLocation();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<UploadStep>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NFT.Storage key input state
  const [keyInput, setKeyInput] = useState(storedKey);
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(hasKey);

  const handleSaveKey = () => {
    if (!keyInput.trim()) {
      toast.error("Please enter an API key.");
      return;
    }
    saveKey(keyInput.trim());
    setKeySaved(true);
    toast.success("API key saved locally in your browser.");
  };

  const handleClearKey = () => {
    clearKey();
    setKeyInput("");
    setKeySaved(false);
    toast("API key removed from your browser.");
  };

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMint = async () => {
    if (!file || !title.trim()) {
      toast.error("Please select an image and enter a title.");
      return;
    }
    if (!isConnected || !accountId) {
      toast.error("Connect your NEAR wallet first.");
      return;
    }

    // Determine which key to use: local key takes priority
    const activeKey = storedKey || "";

    try {
      // Step 1: Upload to IPFS via server-side proxy
      setStep("uploading-ipfs");
      const formData = new FormData();
      formData.append("file", file);

      const headers: Record<string, string> = {};
      if (activeKey) {
        // Pass the user's personal key as a header — never stored server-side
        headers["X-NFT-Storage-Key"] = activeKey;
      }

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }

      const { cid, mediaUrl } = (await uploadRes.json()) as {
        cid: string;
        mediaUrl: string;
      };

      // Step 2: Mint NFT on NEAR contract
      setStep("minting");

      const tokenId = `pin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await callMethod("nft_mint", {
        token_id: tokenId,
        receiver_id: accountId,
        token_metadata: {
          title: title.trim(),
          description: description.trim() || null,
          media: mediaUrl,
          extra: JSON.stringify({ cid }),
          copies: 1,
        },
      });

      setMintedTokenId(tokenId);
      setStep("done");
      toast.success("Pin minted successfully!");
    } catch (err) {
      console.error("[Upload] Error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      setStep("idle");
    }
  };

  // --- Not connected state ---
  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center fade-in">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <WalletIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-3">Connect your wallet</h1>
          <p className="text-muted-foreground mb-8">
            You need to connect your NEAR wallet to mint pins as NFTs on the blockchain.
          </p>
          <Button onClick={connect} className="btn-glow gap-2 rounded-full" size="lg">
            <WalletIcon className="h-5 w-5" />
            Connect NEAR Wallet
          </Button>
        </div>
      </div>
    );
  }

  // --- Success state ---
  if (step === "done" && mintedTokenId) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center fade-in">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2Icon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-3">Pin minted!</h1>
          <p className="text-muted-foreground mb-8">
            Your image has been uploaded to IPFS and minted as an NFT on NEAR.
          </p>
          {preview && (
            <img
              src={preview}
              alt={title}
              className="w-full max-h-64 object-cover rounded-2xl mb-6 border border-border"
            />
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setTitle("");
                setDescription("");
                setStep("idle");
                setMintedTokenId(null);
              }}
            >
              <UploadCloudIcon className="h-4 w-4" />
              Upload another
            </Button>
            <Button
              className="btn-glow gap-2 rounded-full"
              onClick={() => navigate(`/pin/${mintedTokenId}`)}
            >
              View pin
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing = step === "uploading-ipfs" || step === "minting";

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto fade-in space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-display font-semibold mb-2">Create a Pin</h1>
          <p className="text-muted-foreground">
            Upload an image to IPFS and mint it as an NFT on the NEAR blockchain.
          </p>
        </div>

        {/* ── NFT.Storage API Key card ── */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              NFT.Storage API Key
            </span>
            {keySaved && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckIcon className="h-3 w-3" />
                Saved locally
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your key is stored <strong>only in your browser</strong> (localStorage) and sent
            directly to the upload endpoint on each request. It is never persisted on the server.
            Get a free key at{" "}
            <a
              href="https://nft.storage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              nft.storage
            </a>
            .
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Paste your nft.storage API key…"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setKeySaved(false);
                }}
                disabled={isProcessing}
                className="bg-input border-border pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveKey}
              disabled={isProcessing || !keyInput.trim()}
              className="shrink-0 gap-1.5"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Save
            </Button>

            {hasKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearKey}
                disabled={isProcessing}
                className="shrink-0 text-destructive hover:text-destructive gap-1.5"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>

          {!hasKey && !keyInput && (
            <p className="text-xs text-amber-400/80">
              ⚠ No key set. Uploads will use the site-wide key if one is configured in Settings,
              otherwise they will fail.
            </p>
          )}
        </div>

        {/* ── Image + metadata form ── */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Image upload */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Image</Label>

            {!preview ? (
              <div
                className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-colors min-h-[280px] ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <UploadCloudIcon className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">
                  {isDragging ? "Drop it here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP · max 20 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full object-cover max-h-80"
                />
                <button
                  onClick={clearFile}
                  disabled={isProcessing}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors disabled:opacity-50"
                >
                  <XIcon className="h-4 w-4" />
                </button>
                <div className="absolute bottom-3 left-3 text-xs text-white/80 bg-black/50 px-2 py-1 rounded-full">
                  <ImageIcon className="h-3 w-3 inline mr-1" />
                  {file?.name}
                </div>
              </div>
            )}
          </div>

          {/* Right: Metadata form */}
          <div className="flex flex-col gap-5">
            <div>
              <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Give your pin a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isProcessing}
                maxLength={100}
                className="bg-input border-border"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Description
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your pin…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
                maxLength={500}
                rows={4}
                className="bg-input border-border resize-none"
              />
            </div>

            {/* Wallet info */}
            <div className="rounded-xl bg-secondary/50 border border-border/50 p-3 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Minting as: </span>
              <span className="font-mono">{accountId}</span>
            </div>

            {/* Mint button */}
            <Button
              onClick={handleMint}
              disabled={!file || !title.trim() || isProcessing}
              className="btn-glow gap-2 rounded-full mt-auto"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  {step === "uploading-ipfs" ? "Uploading to IPFS…" : "Minting NFT…"}
                </>
              ) : (
                <>
                  <UploadCloudIcon className="h-4 w-4" />
                  Mint Pin
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="text-xs text-muted-foreground text-center">
                {step === "uploading-ipfs"
                  ? "Securely uploading your image to IPFS…"
                  : "Confirm the transaction in your NEAR wallet…"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
