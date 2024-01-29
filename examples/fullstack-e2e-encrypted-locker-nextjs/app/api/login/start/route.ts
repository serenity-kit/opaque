import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { SERVER_SETUP } from "../../env";
import { checkRateLimit } from "../../rateLimiter";
import { LoginStartParams } from "../../schema";

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  let userIdentifier, startLoginRequest;
  try {
    const rawValues = await request.json();
    const values = LoginStartParams.parse(rawValues);
    userIdentifier = values.userIdentifier;
    startLoginRequest = values.startLoginRequest;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input values" },
      { status: 400 },
    );
  }

  const db = await database;
  const registrationRecord = await db.getUser(userIdentifier);

  if (!registrationRecord)
    return NextResponse.json({ error: "user not registered" }, { status: 400 });

  const hasLogin = await db.hasLogin(userIdentifier);
  if (hasLogin)
    return NextResponse.json(
      { error: "login already started" },
      { status: 400 },
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
