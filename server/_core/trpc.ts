import {
  NOT_ADMIN_ERR_MSG,
  PRO_SUBSCRIPTION_REQUIRED_MSG,
  UNAUTHED_ERR_MSG,
} from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { userHasProAccess } from "../entitlements";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requirePro = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const user = ctx.user;
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  const ok = await userHasProAccess(user.id, user.openId);
  if (!ok) {
    throw new TRPCError({ code: "FORBIDDEN", message: PRO_SUBSCRIPTION_REQUIRED_MSG });
  }
  return next({ ctx: { ...ctx, user } });
});

export const proProcedure = t.procedure.use(requireUser).use(requirePro);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
