import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { SERVER_SETUP } from "../../env";
import { checkRateLimit } from "../../rateLimiter";
import { RegisterStartParams } from "../../schema";

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  let userIdentifier, registrationRequest;
  try {
    const rawValues = await request.json();
    const values = RegisterStartParams.parse(rawValues);
    userIdentifier = values.userIdentifier;
    registrationRequest = values.registrationRequest;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input values" },
      { status: 400 },
    );
  }

  const db = await database;
  const hasUser = await db.hasUser(userIdentifier);
  if (hasUser)
    return NextResponse.json(
      { error: "user already registered" },
      { status: 400 },
    );

  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: SERVER_SETUP,
    userIdentifier,
    registrationRequest,
  });

  return NextResponse.json({ registrationResponse });
}
