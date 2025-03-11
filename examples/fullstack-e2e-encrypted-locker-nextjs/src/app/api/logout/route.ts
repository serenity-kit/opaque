import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import database from "../db";

export async function POST(request: NextRequest) {
  const db = await database;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (sessionCookie) {
    await db.removeSession(sessionCookie.value);
    cookieStore.set({
      name: "session",
      value: "",
      path: "/",
      maxAge: 0,
    });
  }

  return NextResponse.json({ ok: true });
}
