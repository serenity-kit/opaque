import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";
import { SERVER_SETUP } from "../../../env";

export async function POST(request: NextRequest) {
  const { userIdentifier, startLoginRequest } = await request.json();

  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );
  if (!startLoginRequest)
    return NextResponse.json(
      { error: "missing startLoginRequest" },
      { status: 400 }
    );

  const db = await database;

  const hasLogin = await db.hasRecoveryLogin(userIdentifier);
  if (hasLogin)
    return NextResponse.json(
      { error: "login already started" },
      { status: 400 }
    );

  const recovery = await db.getRecovery(userIdentifier);

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup: SERVER_SETUP,
    userIdentifier,
    registrationRecord: recovery?.registrationRecord,
    startLoginRequest,
  });

  if (recovery != null) {
    await db.setRecoveryLogin(userIdentifier, serverLoginState);
  }

  return NextResponse.json({ loginResponse });
}
