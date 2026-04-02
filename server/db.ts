import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { documents, InsertUser, userEntitlements, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listDocumentsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId));
}

export async function upsertDocumentForUser(
  userId: number,
  input: {
    id: string;
    name: string;
    content: string;
    clientUpdatedMs: number;
    clientCreatedMs?: number;
  },
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const created = new Date(input.clientCreatedMs ?? input.clientUpdatedMs);
  const updated = new Date(input.clientUpdatedMs);
  await db
    .insert(documents)
    .values({
      userId,
      id: input.id,
      name: input.name,
      content: input.content,
      version: 1,
      createdAt: created,
      updatedAt: updated,
    })
    .onDuplicateKeyUpdate({
      set: {
        name: input.name,
        content: input.content,
        version: sql`${documents.version} + 1`,
        updatedAt: updated,
      },
    });
}

export async function deleteDocumentForUser(userId: number, documentId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db
    .delete(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, documentId)));
}

export async function getUserEntitlement(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(userEntitlements)
    .where(eq(userEntitlements.userId, userId))
    .limit(1);
  return rows[0];
}

export async function upsertUserEntitlement(userId: number, proExpiresAt: Date | null) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert entitlement: database not available");
    return;
  }
  await db
    .insert(userEntitlements)
    .values({
      userId,
      proExpiresAt,
    })
    .onDuplicateKeyUpdate({
      set: {
        proExpiresAt,
      },
    });
}
