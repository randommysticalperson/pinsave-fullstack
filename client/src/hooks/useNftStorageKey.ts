import { useState, useCallback } from "react";

const LS_KEY = "pinsave_ipfs_storage_key";

/**
 * Stores the user's personal Pinata JWT in localStorage.
 * The key is NEVER sent to the server passively — it is only included
 * as the X-IPFS-Storage-Key request header when the user triggers an upload.
 *
 * Get a free Pinata JWT at https://app.pinata.cloud/developers/api-keys
 */
export function useNftStorageKey() {
  const [key, setKeyState] = useState<string>(() => {
    try {
      // Migrate old key name if present
      const legacy = localStorage.getItem("pinsave_nft_storage_key");
      if (legacy) {
        localStorage.setItem(LS_KEY, legacy);
        localStorage.removeItem("pinsave_nft_storage_key");
        return legacy;
      }
      return localStorage.getItem(LS_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const saveKey = useCallback((value: string) => {
    const trimmed = value.trim();
    try {
      if (trimmed) {
        localStorage.setItem(LS_KEY, trimmed);
      } else {
        localStorage.removeItem(LS_KEY);
      }
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
    setKeyState(trimmed);
  }, []);

  const clearKey = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // ignore
    }
    setKeyState("");
  }, []);

  return {
    /** The stored Pinata JWT, or empty string if not set */
    key,
    /** Whether a key has been saved */
    hasKey: key.length > 0,
    /** Save (or clear if empty) the key to localStorage */
    saveKey,
    /** Remove the key from localStorage */
    clearKey,
  };
}
