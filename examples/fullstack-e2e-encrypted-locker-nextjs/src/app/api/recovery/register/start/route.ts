import { checkRateLimit } from "@/app/api/rateLimiter";
import { RecoveryRegisterStart } from "@/app/api/schema";
import withUserSession from "@/app/api/withUserSession";
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

  const db = await database;

  return withUserSession(db, async (session) => {
    const recovery = await db.getRecovery(session.userIdentifier);
    if (recovery != null) {
      return NextResponse.json(
        { error: "recovery lockbox already exists" },
        { status: 400 },
      );
    }

    let registrationRequest;
    try {
      const rawValues = await request.json();
      const values = RecoveryRegisterStart.parse(rawValues);
      registrationRequest = values.registrationRequest;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid input values" },
        { status: 400 },
      );
    }

    const { registrationResponse } = opaque.server.createRegistrationResponse({
      serverSetup: SERVER_SETUP,
      userIdentifier: session.userIdentifier,
      registrationRequest,
    });

    return NextResponse.json({ registrationResponse });
  });
}
