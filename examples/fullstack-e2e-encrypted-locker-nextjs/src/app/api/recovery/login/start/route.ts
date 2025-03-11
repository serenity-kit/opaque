import { checkRateLimit } from "@/app/api/rateLimiter";
import { LoginStartParams } from "@/app/api/schema";
import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";
import { SERVER_SETUP } from "../../../env";

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

  const hasLogin = await db.hasRecoveryLogin(userIdentifier);
  if (hasLogin)
    return NextResponse.json(
      { error: "login already started" },
      { status: 400 },
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
