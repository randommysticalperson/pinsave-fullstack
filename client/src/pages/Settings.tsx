import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  SettingsIcon,
  KeyIcon,
  NetworkIcon,
  FileCodeIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  ShieldCheckIcon,
  LockIcon,
  AlertTriangleIcon,
} from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const isOwner = user?.role === "admin";

  const { data: settings, isLoading, refetch } = trpc.config.get.useQuery();
  const saveMutation = trpc.config.save.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully.");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save settings.");
    },
  });

  const [apiKey, setApiKey] = useState("");
  const [contractName, setContractName] = useState("");
  const [networkId, setNetworkId] = useState<"testnet" | "mainnet">("testnet");
  const [showApiKey, setShowApiKey] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setContractName(settings.nearContractName);
      setNetworkId(settings.nearNetworkId as "testnet" | "mainnet");
    }
  }, [settings]);

  const handleSave = () => {
    const payload: {
      nftStorageApiKey?: string;
      nearContractName?: string;
      nearNetworkId?: "testnet" | "mainnet";
    } = {};

    if (apiKey.trim()) payload.nftStorageApiKey = apiKey.trim();
    if (contractName.trim()) payload.nearContractName = contractName.trim();
    payload.nearNetworkId = networkId;

    saveMutation.mutate(payload);
  };

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure your NEAR contract and Pinata IPFS integration.
            </p>
          </div>
        </div>

        {/* Current status */}
        {!isLoading && settings && (
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-4 mb-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className={`h-2 w-2 rounded-full ${settings.nftStorageApiKeySet ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="text-muted-foreground">Pinata JWT:</span>
              <span className={settings.nftStorageApiKeySet ? "text-primary font-medium" : "text-muted-foreground"}>
                {settings.nftStorageApiKeySet
                  ? settings.nftStorageApiKeyMasked
                  : "Not configured"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Contract:</span>
              <span className="font-mono text-xs">{settings.nearContractName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">Network:</span>
              <span className="font-medium capitalize">{settings.nearNetworkId}</span>
            </div>
          </div>
        )}

        {/* Access control notice */}
        {!isOwner && (
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 mb-8 flex items-start gap-3">
            <LockIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Owner access required</p>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? "Only the site owner can modify these settings. You are logged in but do not have owner privileges."
                  : "Sign in with the owner account to modify these settings."}
              </p>
            </div>
          </div>
        )}

        {/* Settings form */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Pinata section */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <KeyIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pinata IPFS
              </h2>
            </div>
            {/* NFT.Storage Classic deprecation notice */}
            <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 mb-5">
              <AlertTriangleIcon className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-300/90 leading-relaxed space-y-1">
                <p className="font-semibold text-amber-300">
                  NFT.Storage Classic was permanently shut down on June 30, 2024.
                </p>
                <p>
                  Any existing NFT.Storage API keys are no longer valid. This app now uses{" "}
                  <a
                    href="https://pinata.cloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-amber-200 transition-colors"
                  >
                    Pinata
                  </a>{" "}
                  as its IPFS storage provider. Please generate a new Pinata JWT below.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-5">
              The site-wide Pinata JWT is stored securely on the server and never exposed to the
              browser. Individual users can also supply their own JWT on the Upload page.
              Get a free JWT at{" "}
              <a
                href="https://app.pinata.cloud/developers/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                app.pinata.cloud
              </a>
              .
            </p>

            <div>
              <Label htmlFor="apiKey" className="text-sm font-medium mb-2 block">
                Pinata JWT
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder={
                    settings?.nftStorageApiKeySet
                      ? "Enter new JWT to update…"
                      : "Paste your Pinata JWT…"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={!isOwner || saveMutation.isPending}
                  className="bg-input border-border pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {settings?.nftStorageApiKeySet && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <ShieldCheckIcon className="h-3 w-3 text-primary" />
                  Current key: {settings.nftStorageApiKeyMasked}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* NEAR section */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <NetworkIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                NEAR Protocol
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Configure which NEAR network and smart contract to use.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractName" className="text-sm font-medium mb-2 block">
                  Contract Name
                </Label>
                <div className="relative">
                  <FileCodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="contractName"
                    placeholder="pinsave.testnet"
                    value={contractName}
                    onChange={(e) => setContractName(e.target.value)}
                    disabled={!isOwner || saveMutation.isPending}
                    className="bg-input border-border pl-9 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="networkId" className="text-sm font-medium mb-2 block">
                  Network
                </Label>
                <Select
                  value={networkId}
                  onValueChange={(v) => setNetworkId(v as "testnet" | "mainnet")}
                  disabled={!isOwner || saveMutation.isPending}
                >
                  <SelectTrigger id="networkId" className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testnet">Testnet</SelectItem>
                    <SelectItem value="mainnet">Mainnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Save button */}
          {isOwner && (
            <>
              <Separator />
              <div className="p-6 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="btn-glow gap-2 rounded-full"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Security note */}
        <div className="mt-6 rounded-xl bg-secondary/30 border border-border/40 p-4 flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">Security note: </span>
            The NFT.Storage API key is stored in the server database and only used server-side to proxy
            image uploads to IPFS. It is never sent to the browser or included in any client-side bundle.
          </p>
        </div>
      </div>
    </div>
  );
}
