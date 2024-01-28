import { RecoveryRegisterFinish } from "@/app/api/schema";
import withUserSession from "@/app/api/withUserSession";
import { NextResponse } from "next/server";
import database from "../../../db";

export async function POST(request: Request) {
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
