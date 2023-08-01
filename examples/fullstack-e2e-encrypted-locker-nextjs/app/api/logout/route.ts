import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import database from "../db";

export async function POST(req: NextRequest) {
  const db = await database;
  const sessionCookie = cookies().get("session");
  if (sessionCookie) {
    await db.removeSession(sessionCookie.value);
    cookies().set({
      name: "session",
      value: "",
      path: "/",
      maxAge: 0,
    });
  }

  return NextResponse.json({ ok: true });
}
