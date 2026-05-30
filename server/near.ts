import { JsonRpcProvider } from "near-api-js";
import { getConfigValue, CONFIG_KEYS } from "./configDb";

// ---------------------------------------------------------------------------
// Environment-driven NEAR configuration (DB-first, env fallback)
// ---------------------------------------------------------------------------

export async function getNearNetworkId(): Promise<string> {
  return (await getConfigValue(CONFIG_KEYS.NEAR_NETWORK_ID)) ?? "testnet";
}

export async function getNearContractName(): Promise<string> {
  return (await getConfigValue(CONFIG_KEYS.NEAR_CONTRACT_NAME)) ?? "pinsave.testnet";
}

function getNodeUrl(networkId: string): string {
  return networkId === "mainnet"
    ? "https://rpc.mainnet.near.org"
    : "https://rpc.testnet.near.org";
}

function getWalletUrl(networkId: string): string {
  return networkId === "mainnet"
    ? "https://wallet.near.org"
    : "https://testnet.mynearwallet.com";
}

function getHelperUrl(networkId: string): string {
  return networkId === "mainnet"
    ? "https://helper.mainnet.near.org"
    : "https://helper.testnet.near.org";
}

function getExplorerUrl(networkId: string): string {
  return networkId === "mainnet"
    ? "https://nearblocks.io"
    : "https://testnet.nearblocks.io";
}

// Public config object sent to the frontend (no secrets)
export async function getPublicNearConfig() {
  const networkId = await getNearNetworkId();
  const contractName = await getNearContractName();
  return {
    networkId,
    contractName,
    nodeUrl: getNodeUrl(networkId),
    walletUrl: getWalletUrl(networkId),
    helperUrl: getHelperUrl(networkId),
    explorerUrl: getExplorerUrl(networkId),
  };
}

// ---------------------------------------------------------------------------
// Token types (mirrors the NEAR NFT contract)
// ---------------------------------------------------------------------------

export interface TokenMetadata {
  title?: string | null;
  description?: string | null;
  media?: string | null;
  media_hash?: string | null;
  copies?: number | null;
  issued_at?: string | null;
  expires_at?: string | null;
  starts_at?: string | null;
  updated_at?: string | null;
  extra?: string | null;
  reference?: string | null;
  reference_hash?: string | null;
}

export interface NftToken {
  token_id: string;
  owner_id: string;
  metadata: TokenMetadata;
}

// ---------------------------------------------------------------------------
// Server-side view-call helper using JsonRpcProvider
// ---------------------------------------------------------------------------

async function viewCall<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
  const networkId = await getNearNetworkId();
  const contractId = await getNearContractName();
  const provider = new JsonRpcProvider({ url: getNodeUrl(networkId) });
  const argsBase64 = Buffer.from(JSON.stringify(args)).toString("base64");

  const result = await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: contractId,
    method_name: method,
    args_base64: argsBase64,
  });

  const bytes = (result as unknown as { result: number[] }).result;
  const json = Buffer.from(bytes).toString("utf8");
  return JSON.parse(json) as T;
}

export async function nftTokens(fromIndex = "0", limit = 50): Promise<NftToken[]> {
  try {
    return await viewCall<NftToken[]>("nft_tokens", { from_index: fromIndex, limit });
  } catch {
    return [];
  }
}

export async function nftToken(tokenId: string): Promise<NftToken | null> {
  try {
    return await viewCall<NftToken | null>("nft_token", { token_id: tokenId });
  } catch {
    return null;
  }
}

export async function nftTokensForOwner(
  accountId: string,
  fromIndex = "0",
  limit = 50
): Promise<NftToken[]> {
  try {
    return await viewCall<NftToken[]>("nft_tokens_for_owner", {
      account_id: accountId,
      from_index: fromIndex,
      limit,
    });
  } catch {
    return [];
  }
}
