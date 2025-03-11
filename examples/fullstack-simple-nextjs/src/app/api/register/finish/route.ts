import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { checkRateLimit } from "../../rateLimiter";
import { RegisterFinishParams } from "../../schema";

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  let userIdentifier, registrationRecord;
  try {
    const rawValues = await request.json();
    const values = RegisterFinishParams.parse(rawValues);
    userIdentifier = values.userIdentifier;
    registrationRecord = values.registrationRecord;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input values" },
      { status: 400 },
    );
  }

  const db = await database;
  const existingUser = await db.getUser(userIdentifier);
  if (!existingUser) {
    await db.setUser(userIdentifier, registrationRecord);
  }

  // return a 200 even if the user already exists to avoid leaking
  // the information if the user exists or not
  return NextResponse.json({ success: true });
}
