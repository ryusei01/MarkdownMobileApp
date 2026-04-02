import type { UserEntitlement } from "../drizzle/schema";
import * as db from "./db";
import { ENV } from "./_core/env";

export async function userHasProAccess(
  userId: number,
  userOpenId: string,
  ent?: UserEntitlement | null,
): Promise<boolean> {
  if (ENV.devGrantAllPro) {
    return true;
  }
  if (ENV.ownerOpenId && userOpenId === ENV.ownerOpenId) {
    return true;
  }
  const row = ent ?? (await db.getUserEntitlement(userId));
  if (!row?.proExpiresAt) {
    return false;
  }
  return row.proExpiresAt.getTime() > Date.now();
}
