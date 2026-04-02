import type { Express, Request, Response } from "express";
import * as db from "./db";
import { ENV } from "./_core/env";

function pickExpirationMs(body: Record<string, unknown>): number | undefined {
  const ev = body["event"] as Record<string, unknown> | undefined;
  if (!ev) return undefined;
  const ms = ev["expiration_at_ms"];
  if (typeof ms === "number") return ms;
  if (typeof ms === "string") return parseInt(ms, 10);
  return undefined;
}

function pickAppUserId(body: Record<string, unknown>): string | undefined {
  const ev = body["event"] as Record<string, unknown> | undefined;
  const id = ev?.["app_user_id"];
  return typeof id === "string" ? id : undefined;
}

/**
 * RevenueCat webhook: set Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>.
 * Maps `app_user_id` to `users.openId` and stores `expiration_at_ms` as Pro expiry.
 */
export function registerBillingRoutes(app: Express) {
  app.post("/api/billing/revenuecat", async (req: Request, res: Response) => {
    const secret = ENV.revenueCatWebhookSecret;
    if (secret) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${secret}`) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    }

    const body = req.body as Record<string, unknown>;
    const appUserId = pickAppUserId(body);
    const expMs = pickExpirationMs(body);

    if (!appUserId) {
      res.status(400).json({ error: "Missing app_user_id" });
      return;
    }

    const user = await db.getUserByOpenId(appUserId);
    if (!user) {
      console.warn("[Billing] RevenueCat: unknown app_user_id", appUserId);
      res.json({ ok: true, skipped: true });
      return;
    }

    const expires =
      typeof expMs === "number" && !Number.isNaN(expMs) ? new Date(expMs) : null;
    await db.upsertUserEntitlement(user.id, expires);
    res.json({ ok: true });
  });
}
