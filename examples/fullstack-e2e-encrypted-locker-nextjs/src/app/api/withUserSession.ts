import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Datastore, SessionEntry } from "./Datastore";

export default async function withUserSession(
  db: Datastore,
  callback: (session: SessionEntry) => Promise<NextResponse> | NextResponse,
) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "missing session cookie" },
      { status: 401 },
    );
  }

  const session = await db.getSession(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  return callback(session);
}
