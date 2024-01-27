import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { SERVER_SETUP } from "../../env";

export async function POST(req: NextRequest) {
  const { userIdentifier, registrationRequest } = await req.json();

  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 },
    );
  if (!registrationRequest)
    return NextResponse.json(
      { error: "missing registrationRequest" },
      { status: 400 },
    );

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
