import { NextRequest, NextResponse } from "next/server";
import database from "../db";
import { checkRateLimit } from "../rateLimiter";
import withUserSession from "../withUserSession";

export async function DELETE(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  const db = await database;

  return withUserSession(db, async (session) => {
    await db.removeRecovery(session.userIdentifier);
    return NextResponse.json({ success: true });
  });
}
