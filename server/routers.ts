import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getPublicNearConfig,
  nftToken,
  nftTokens,
  nftTokensForOwner,
} from "./near";
import { getAppSettings, setConfigValue, CONFIG_KEYS } from "./configDb";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // -------------------------------------------------------------------------
  // NEAR configuration (safe, non-secret values only)
  // -------------------------------------------------------------------------
  nearConfig: publicProcedure.query(async () => {
    return getPublicNearConfig();
  }),

  // -------------------------------------------------------------------------
  // App settings (owner-only write, public read of masked values)
  // -------------------------------------------------------------------------
  config: router({
    get: publicProcedure.query(async () => {
      return getAppSettings();
    }),

    save: protectedProcedure
      .input(
        z.object({
          nftStorageApiKey: z.string().optional(),
          nearContractName: z.string().min(1).optional(),
          nearNetworkId: z.enum(["testnet", "mainnet"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only the owner (admin role) can update settings
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the site owner can update settings.",
          });
        }

        if (input.nftStorageApiKey) {
          await setConfigValue(CONFIG_KEYS.NFT_STORAGE_API_KEY, input.nftStorageApiKey);
        }
        if (input.nearContractName) {
          await setConfigValue(CONFIG_KEYS.NEAR_CONTRACT_NAME, input.nearContractName);
        }
        if (input.nearNetworkId) {
          await setConfigValue(CONFIG_KEYS.NEAR_NETWORK_ID, input.nearNetworkId);
        }

        return { success: true };
      }),
  }),

  // -------------------------------------------------------------------------
  // NFT pin procedures
  // -------------------------------------------------------------------------
  pins: router({
    list: publicProcedure
      .input(
        z
          .object({
            fromIndex: z.string().optional(),
            limit: z.number().min(1).max(100).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return nftTokens(input?.fromIndex ?? "0", input?.limit ?? 50);
      }),

    byOwner: publicProcedure
      .input(
        z.object({
          accountId: z.string().min(1),
          fromIndex: z.string().optional(),
          limit: z.number().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return nftTokensForOwner(
          input.accountId,
          input.fromIndex ?? "0",
          input.limit ?? 50
        );
      }),

    byId: publicProcedure
      .input(z.object({ tokenId: z.string().min(1) }))
      .query(async ({ input }) => {
        return nftToken(input.tokenId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
