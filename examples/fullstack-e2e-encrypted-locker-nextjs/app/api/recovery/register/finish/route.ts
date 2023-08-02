import { NextResponse } from "next/server";
import database from "../../../db";
import { cookies } from "next/headers";
import isRecoveryLockboxObject from "@/app/utils/isRecoveryLockboxObject";

export async function POST(request: Request) {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie) {
    return NextResponse.json(
      { error: "missing session cookie" },
      { status: 401 }
    );
  }

  const db = await database;
  const session = await db.getSession(sessionCookie.value);
  if (!session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

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
}
