import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { hashPin, verifyPin } from "@/lib/auth/crypto";
import { authenticate, isAuthenticated } from "@/lib/auth/middleware";
import { invalidateAllSessions, createSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!isAuthenticated(auth)) return auth;

  const { env } = await getCloudflareContext();
  const db = getDb(env.DB);

  const { pin, action } = await request.json();

  if (action === "set") {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }
    const pinHash = await hashPin(pin);
    await db
      .update(schema.users)
      .set({ pinHash, pinAttempts: 0, updatedAt: new Date() })
      .where(eq(schema.users.id, auth.userId));
    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, auth.userId))
      .limit(1);

    if (!user?.pinHash) {
      return NextResponse.json({ error: "No PIN set" }, { status: 400 });
    }

    if (user.pinAttempts >= 3) {
      await db
        .update(schema.users)
        .set({ pinHash: null, pinAttempts: 0, updatedAt: new Date() })
        .where(eq(schema.users.id, auth.userId));
      await invalidateAllSessions(db, auth.userId);
      const response = NextResponse.json(
        { error: "Too many attempts. PIN cleared. Please log in again." },
        { status: 403 }
      );
      response.cookies.delete("session");
      return response;
    }

    const valid = await verifyPin(pin, user.pinHash);
    if (!valid) {
      const attempts = user.pinAttempts + 1;
      await db
        .update(schema.users)
        .set({ pinAttempts: attempts })
        .where(eq(schema.users.id, auth.userId));

      if (attempts >= 3) {
        await db
          .update(schema.users)
          .set({ pinHash: null, pinAttempts: 0, updatedAt: new Date() })
          .where(eq(schema.users.id, auth.userId));
        await invalidateAllSessions(db, auth.userId);
        const response = NextResponse.json(
          { error: "Too many attempts. PIN cleared. Please log in again." },
          { status: 403 }
        );
        response.cookies.delete("session");
        return response;
      }

      return NextResponse.json(
        { error: `Incorrect PIN. ${3 - attempts} attempts remaining.` },
        { status: 401 }
      );
    }

    await db
      .update(schema.users)
      .set({ pinAttempts: 0 })
      .where(eq(schema.users.id, auth.userId));

    const token = await createSession(db, auth.userId, env.JWT_SECRET);
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  }

  if (action === "remove") {
    await db
      .update(schema.users)
      .set({ pinHash: null, pinAttempts: 0, updatedAt: new Date() })
      .where(eq(schema.users.id, auth.userId));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
