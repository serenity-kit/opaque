import * as opaque from "@serenity-kit/opaque";
import { NextResponse } from "next/server";
import database from "../../db";

export async function POST(request: Request) {
  const { userIdentifier, registrationRecord } = await request.json();
  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );
  if (!registrationRecord)
    return NextResponse.json(
      { error: "missing registrationRecord" },
      { status: 400 }
    );
  const db = await database;
  await db.setUser(userIdentifier, registrationRecord);
  return NextResponse.json({ success: true });
}
