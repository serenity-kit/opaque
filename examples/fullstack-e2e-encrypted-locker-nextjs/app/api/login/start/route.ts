import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { SERVER_SETUP } from "../../env";

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
  const registrationRecord = await db.getUser(userIdentifier);

  if (!registrationRecord)
    return NextResponse.json({ error: "user not registered" }, { status: 400 });

  const hasLogin = await db.hasLogin(userIdentifier);
  if (hasLogin)
    return NextResponse.json(
      { error: "login already started" },
      { status: 400 }
    );

  const { serverLoginState, loginResponse } = opaque.server.startLogin({
    serverSetup: SERVER_SETUP,
    userIdentifier,
    registrationRecord,
    startLoginRequest,
  });

  await db.setLogin(userIdentifier, serverLoginState);
  return NextResponse.json({ loginResponse });
}
