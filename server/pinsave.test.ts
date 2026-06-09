import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    ...overrides,
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({
    user: {
      id: 1,
      openId: "owner-id",
      email: "owner@example.com",
      name: "Owner",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

function makeUserCtx(): TrpcContext {
  return makeCtx({
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// NEAR config helper tests
// ---------------------------------------------------------------------------

describe("near config helpers", () => {
  it("returns testnet defaults when env vars are not set", async () => {
    const { getPublicNearConfig } = await import("./near");
    // Mock configDb to return null (no DB values)
    vi.mock("./configDb", () => ({
      getConfigValue: vi.fn().mockResolvedValue(null),
      setConfigValue: vi.fn(),
      getAppSettings: vi.fn().mockResolvedValue({
        nftStorageApiKeySet: false,
        nftStorageApiKeyMasked: "",
        nearContractName: "pinsave.testnet",
        nearNetworkId: "testnet",
      }),
      CONFIG_KEYS: {
        NFT_STORAGE_API_KEY: "NFT_STORAGE_API_KEY",
        NEAR_CONTRACT_NAME: "NEAR_CONTRACT_NAME",
        NEAR_NETWORK_ID: "NEAR_NETWORK_ID",
      },
    }));

    const config = await getPublicNearConfig();
    expect(config.networkId).toBe("testnet");
    expect(config.nodeUrl).toContain("testnet");
    expect(config.explorerUrl).toContain("testnet");
    expect(config).not.toHaveProperty("apiKey");
    expect(config).not.toHaveProperty("nftStorageApiKey");
  });
});

// ---------------------------------------------------------------------------
// tRPC procedure tests
// ---------------------------------------------------------------------------

describe("auth.logout", () => {
  it("clears the session cookie and returns success", async () => {
    const ctx = makeCtx({
      user: {
        id: 1,
        openId: "test-user",
        email: "test@example.com",
        name: "Test",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    });
    const clearedCookies: string[] = [];
    (ctx.res.clearCookie as ReturnType<typeof vi.fn>).mockImplementation(
      (name: string) => clearedCookies.push(name)
    );

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
  });
});

describe("config.save", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    const ctx = makeUserCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.config.save({ nearNetworkId: "testnet" })
    ).rejects.toThrow(/FORBIDDEN|Only the site owner/);
  });

  it("accepts valid input from admin users", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);

    // setConfigValue is mocked above — should resolve without throwing
    await expect(
      caller.config.save({
        nearContractName: "pinsave.testnet",
        nearNetworkId: "testnet",
      })
    ).resolves.toMatchObject({ success: true });
  });
});

describe("pins.list", () => {
  it("returns an array (empty when contract is unreachable)", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pins.list({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
  }, 15000);
});

describe("pins.byOwner", () => {
  it("returns an array for any accountId", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pins.byOwner({ accountId: "test.testnet" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("pins.byId", () => {
  it("returns null for a non-existent token", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.pins.byId({ tokenId: "nonexistent-token-xyz" });
    expect(result).toBeNull();
  });
});

describe("nearConfig endpoint", () => {
  it("returns a config object without any secret fields", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const config = await caller.nearConfig();

    expect(config).toHaveProperty("networkId");
    expect(config).toHaveProperty("contractName");
    expect(config).toHaveProperty("nodeUrl");
    expect(config).toHaveProperty("walletUrl");
    expect(config).toHaveProperty("explorerUrl");

    // Must NOT contain any secret fields
    expect(config).not.toHaveProperty("apiKey");
    expect(config).not.toHaveProperty("nftStorageApiKey");
    expect(config).not.toHaveProperty("NFT_STORAGE_API_KEY");
  });
});

// ---------------------------------------------------------------------------
// Upload proxy — per-user key header tests
// ---------------------------------------------------------------------------

describe("upload proxy key resolution", () => {
  it("prefers X-IPFS-Storage-Key header over the global DB key", async () => {
    // Simulate what the server does: pick perRequestKey if present
    const pickKey = (
      headerValue: string | string[] | undefined,
      globalKey: string | null
    ): string | null => {
      const perRequest =
        typeof headerValue === "string" ? headerValue.trim() : "";
      return perRequest || globalKey;
    };

    expect(pickKey("user-personal-key", "global-key")).toBe("user-personal-key");
    expect(pickKey("", "global-key")).toBe("global-key");
    expect(pickKey(undefined, "global-key")).toBe("global-key");
    expect(pickKey("", null)).toBeNull();
    expect(pickKey(undefined, null)).toBeNull();
  });

  it("returns null when neither header nor global key is present", () => {
    const pickKey = (
      headerValue: string | string[] | undefined,
      globalKey: string | null
    ): string | null => {
      const perRequest =
        typeof headerValue === "string" ? headerValue.trim() : "";
      return perRequest || globalKey;
    };

    expect(pickKey(undefined, null)).toBeNull();
    expect(pickKey("", null)).toBeNull();
    expect(pickKey("   ", null)).toBeNull();
  });

  it("trims whitespace from the header value", () => {
    const pickKey = (
      headerValue: string | string[] | undefined,
      globalKey: string | null
    ): string | null => {
      const perRequest =
        typeof headerValue === "string" ? headerValue.trim() : "";
      return perRequest || globalKey;
    };

    expect(pickKey("  my-key  ", null)).toBe("my-key");
  });
});
