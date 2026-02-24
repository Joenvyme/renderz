import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Pool } from "pg";
import { del } from "@vercel/blob";

export async function DELETE() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  let avatarUrl: string | null = null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      'SELECT email, image FROM "user" WHERE id = $1',
      [session.user.id]
    );

    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    avatarUrl = userResult.rows[0]?.image ?? null;
    const userEmail = userResult.rows[0]?.email ?? session.user.email ?? "";

    // Remove generated data first.
    await client.query('DELETE FROM "renders" WHERE user_id = $1', [session.user.id]);
    await client.query('DELETE FROM "projects" WHERE user_id = $1', [session.user.id]);

    // Remove Better Auth data rows tied to this user.
    await client.query('DELETE FROM "session" WHERE "userId" = $1', [session.user.id]);
    await client.query('DELETE FROM "account" WHERE "userId" = $1', [session.user.id]);
    await client.query('DELETE FROM "verification" WHERE identifier = $1', [userEmail]);

    // Legacy app table (uuid id) if present.
    await client.query('DELETE FROM "users" WHERE id::text = $1', [session.user.id]);

    // Finally remove auth user row.
    await client.query('DELETE FROM "user" WHERE id = $1', [session.user.id]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  } finally {
    client.release();
    await pool.end();
  }

  if (avatarUrl && avatarUrl.includes("vercel-storage.com")) {
    try {
      await del(avatarUrl);
    } catch (error) {
      // Non-blocking cleanup.
      console.error("Avatar cleanup error after account deletion:", error);
    }
  }

  return NextResponse.json({ success: true });
}

