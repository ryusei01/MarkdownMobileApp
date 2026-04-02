/**
 * tRPCルーター定義
 */

import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import * as db from "./db";
import { userHasProAccess } from "./entitlements";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  proProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  billing: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      const ent = await db.getUserEntitlement(user.id);
      const isPro = await userHasProAccess(user.id, user.openId, ent);
      return {
        isPro,
        proExpiresAt: ent?.proExpiresAt ?? null,
      };
    }),
  }),

  documents: router({
    list: proProcedure.query(async ({ ctx }) => {
      const rows = await db.listDocumentsForUser(ctx.user.id);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        content: r.content,
        version: r.version,
        createdAt: r.createdAt.getTime(),
        updatedAt: r.updatedAt.getTime(),
      }));
    }),

    upsert: proProcedure
      .input(
        z.object({
          id: z.string().max(128),
          name: z.string().max(512),
          content: z.string().max(48_000_000),
          clientUpdatedMs: z.number(),
          clientCreatedMs: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertDocumentForUser(ctx.user.id, input);
        return { ok: true as const };
      }),

    delete: proProcedure
      .input(z.object({ id: z.string().max(128) }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteDocumentForUser(ctx.user.id, input.id);
        return { ok: true as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
