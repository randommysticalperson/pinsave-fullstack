import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { appConfig } from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Config keys
// ---------------------------------------------------------------------------
export const CONFIG_KEYS = {
  NFT_STORAGE_API_KEY: "NFT_STORAGE_API_KEY",
  NEAR_CONTRACT_NAME: "NEAR_CONTRACT_NAME",
  NEAR_NETWORK_ID: "NEAR_NETWORK_ID",
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];

// ---------------------------------------------------------------------------
// Read a single config value — DB first, then process.env fallback
// ---------------------------------------------------------------------------
export async function getConfigValue(key: ConfigKey): Promise<string | null> {
  try {
    const db = await getDb();
    if (db) {
      const rows = await db
        .select()
        .from(appConfig)
        .where(eq(appConfig.key, key))
        .limit(1);
      if (rows.length > 0 && rows[0].value) {
        return rows[0].value;
      }
    }
  } catch (err) {
    console.warn(`[configDb] Failed to read config key "${key}" from DB:`, err);
  }
  // Fallback to environment variable
  return process.env[key] ?? null;
}

// ---------------------------------------------------------------------------
// Write / upsert a config value
// ---------------------------------------------------------------------------
export async function setConfigValue(key: ConfigKey, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .insert(appConfig)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ---------------------------------------------------------------------------
// Read all config values for the settings page
// Returns masked API key so it is never sent in plain text to the frontend
// ---------------------------------------------------------------------------
export interface AppSettings {
  nftStorageApiKeySet: boolean;
  nftStorageApiKeyMasked: string;
  nearContractName: string;
  nearNetworkId: string;
}

export async function getAppSettings(): Promise<AppSettings> {
  const [apiKey, contractName, networkId] = await Promise.all([
    getConfigValue(CONFIG_KEYS.NFT_STORAGE_API_KEY),
    getConfigValue(CONFIG_KEYS.NEAR_CONTRACT_NAME),
    getConfigValue(CONFIG_KEYS.NEAR_NETWORK_ID),
  ]);

  const masked = apiKey
    ? apiKey.slice(0, 6) + "••••••••••••" + apiKey.slice(-4)
    : "";

  return {
    nftStorageApiKeySet: !!apiKey,
    nftStorageApiKeyMasked: masked,
    nearContractName: contractName ?? "pinsave.testnet",
    nearNetworkId: networkId ?? "testnet",
  };
}
