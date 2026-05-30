import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type { WalletSelector, AccountState } from "@near-wallet-selector/core";
import { actionCreators } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NearConfig {
  networkId: string;
  contractName: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
}

export interface NearContextValue {
  nearConfig: NearConfig | null;
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  callMethod: (
    methodName: string,
    args: Record<string, unknown>,
    deposit?: string
  ) => Promise<void>;
}

const NearContext = createContext<NearContextValue>({
  nearConfig: null,
  accountId: null,
  isConnected: false,
  isLoading: true,
  connect: () => {},
  disconnect: async () => {},
  callMethod: async () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NearProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);

  const { data: nearConfig } = trpc.nearConfig.useQuery();

  useEffect(() => {
    if (!nearConfig) return;

    let cancelled = false;

    async function init() {
      if (!nearConfig) return;
      try {
        const { setupWalletSelector } = await import("@near-wallet-selector/core");
        const { setupModal } = await import("@near-wallet-selector/modal-ui");
        const { setupMyNearWallet } = await import("@near-wallet-selector/my-near-wallet");

        const cfg = nearConfig;
        const selector = await setupWalletSelector({
          network: cfg.networkId as "testnet" | "mainnet",
          modules: [
            setupMyNearWallet({
              walletUrl: cfg.walletUrl,
            }),
          ],
        });

        const modal = setupModal(selector, {
          contractId: cfg.contractName,
        });

        if (!cancelled) {
          selectorRef.current = selector;
          modalRef.current = modal;

          // Get current account
          const state = selector.store.getState();
          const accounts: AccountState[] = state.accounts;
          const active = accounts.find((a) => a.active);
          if (active) setAccountId(active.accountId);

          // Subscribe to account changes
          selector.store.observable.subscribe((newState) => {
            const activeAccount = newState.accounts.find((a: AccountState) => a.active);
            setAccountId(activeAccount?.accountId ?? null);
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error("[NearContext] Failed to init wallet selector:", err);
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [nearConfig]);

  const connect = useCallback(() => {
    if (modalRef.current) {
      modalRef.current.show();
    } else {
      toast.error("Wallet selector not ready yet. Please try again.");
    }
  }, []);

  const disconnect = useCallback(async () => {
    const selector = selectorRef.current;
    if (!selector) return;
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccountId(null);
      toast.success("Wallet disconnected.");
    } catch (err) {
      console.error("[NearContext] Disconnect error:", err);
      toast.error("Failed to disconnect wallet.");
    }
  }, []);

  const callMethod = useCallback(
    async (
      methodName: string,
      args: Record<string, unknown>,
      deposit = "10000000000000000000000"
    ) => {
      const selector = selectorRef.current;
      if (!selector || !nearConfig || !accountId) {
        throw new Error("Wallet not connected");
      }
      const wallet = await selector.wallet();
      await wallet.signAndSendTransaction({
        receiverId: nearConfig.contractName,
        actions: [
          actionCreators.functionCall(
            methodName,
            args,
            BigInt("300000000000000"),
            BigInt(deposit)
          ),
        ],
      });
    },
    [nearConfig, accountId]
  );

  return (
    <NearContext.Provider
      value={{
        nearConfig: nearConfig ?? null,
        accountId,
        isConnected: !!accountId,
        isLoading,
        connect,
        disconnect,
        callMethod,
      }}
    >
      {children}
    </NearContext.Provider>
  );
}

export function useNear() {
  return useContext(NearContext);
}
