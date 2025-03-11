import { checkRateLimit } from "@/app/api/rateLimiter";
import { RecoveryRegisterFinish } from "@/app/api/schema";
import withUserSession from "@/app/api/withUserSession";
import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  const db = await database;

  return withUserSession(db, async (session) => {
    let recoveryLockbox, registrationRecord;
    try {
      const rawValues = await request.json();
      const values = RecoveryRegisterFinish.parse(rawValues);
      recoveryLockbox = values.recoveryLockbox;
      registrationRecord = values.registrationRecord;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid input values" },
        { status: 400 },
      );
    }

    await db.setRecovery(session.userIdentifier, {
      registrationRecord,
      recoveryLockbox,
    });

    return NextResponse.json({ success: true });
  });
}
