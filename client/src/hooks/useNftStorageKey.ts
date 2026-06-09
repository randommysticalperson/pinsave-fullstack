import { useState, useCallback } from "react";

const LS_KEY = "pinsave_nft_storage_key";

/**
 * Stores the user's personal NFT.Storage API key in localStorage.
 * The key is NEVER sent to the server passively — it is only included
 * as a request header when the user explicitly triggers an upload.
 */
export function useNftStorageKey() {
  const [key, setKeyState] = useState<string>(() => {
    try {
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
    /** The stored key, or empty string if not set */
    key,
    /** Whether a key has been saved */
    hasKey: key.length > 0,
    /** Save (or clear if empty) the key to localStorage */
    saveKey,
    /** Remove the key from localStorage */
    clearKey,
  };
}
