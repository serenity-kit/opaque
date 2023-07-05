import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";

export async function POST(req: NextRequest) {
  const { userIdentifier, registrationRequest } = await req.json();

  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );
  if (!registrationRequest)
    return NextResponse.json(
      { error: "missing registrationRequest" },
      { status: 400 }
    );

  const db = await database;

  if (db.hasUser(userIdentifier))
    return NextResponse.json(
      { error: "user already registered" },
      { status: 400 }
    );

  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: db.getServerSetup(),
    userIdentifier,
    registrationRequest,
  });

  return NextResponse.json({ registrationResponse });
}
