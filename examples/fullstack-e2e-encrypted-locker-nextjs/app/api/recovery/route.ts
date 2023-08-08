import { NextResponse } from "next/server";
import database from "../db";
import withUserSession from "../withUserSession";

export async function DELETE() {
  const db = await database;

  return withUserSession(db, async (session) => {
    await db.removeRecovery(session.userIdentifier);
    return NextResponse.json({ success: true });
  });
}
