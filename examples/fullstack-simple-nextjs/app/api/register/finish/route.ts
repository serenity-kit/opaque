import { NextResponse } from "next/server";
import database from "../../db";
import { RegisterFinishParams } from "../../schema";

export async function POST(request: Request) {
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
  await db.setUser(userIdentifier, registrationRecord);
  return NextResponse.json({ success: true });
}
