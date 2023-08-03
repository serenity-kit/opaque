import withUserSession from "@/app/api/withUserSession";
import isRecoveryLockboxObject from "@/app/utils/isRecoveryLockboxObject";
import { NextResponse } from "next/server";
import database from "../../../db";

export async function POST(request: Request) {
  const db = await database;

  return withUserSession(db, async (session) => {
    const { recoveryLockbox, registrationRecord } = await request.json();
    if (!isRecoveryLockboxObject(recoveryLockbox))
      return NextResponse.json(
        { error: "missing recoveryLockbox" },
        { status: 400 }
      );
    if (!registrationRecord)
      return NextResponse.json(
        { error: "missing registrationRecord" },
        { status: 400 }
      );

    await db.setRecoveryLockbox(session.userIdentifier, recoveryLockbox);

    return NextResponse.json({ success: true });
  });
}
