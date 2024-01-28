import { LoginFinishParams } from "@/app/api/schema";
import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";

export async function POST(request: NextRequest) {
  let userIdentifier, finishLoginRequest;
  try {
    const rawValues = await request.json();
    const values = LoginFinishParams.parse(rawValues);
    userIdentifier = values.userIdentifier;
    finishLoginRequest = values.finishLoginRequest;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input values" },
      { status: 400 },
    );
  }

  const db = await database;
  const serverLoginState = await db.getRecoveryLogin(userIdentifier);

  if (!serverLoginState)
    return NextResponse.json(
      { error: "recovery login not started" },
      { status: 400 },
    );

  const { sessionKey } = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
  });

  await db.removeRecoveryLogin(userIdentifier);

  const recovery = await db.getRecovery(userIdentifier);
  if (recovery == null) {
    return NextResponse.json({ error: "recovery not found" }, { status: 404 });
  }

  const locker = await db.getLocker(userIdentifier);
  if (locker == null) {
    return NextResponse.json({ error: "locker not found" }, { status: 404 });
  }

  return NextResponse.json(
    { recoveryLockbox: recovery.recoveryLockbox, locker },
    {
      status: 200,
    },
  );
}
