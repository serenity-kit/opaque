import * as opaque from "@serenity-kit/opaque";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";
import { SERVER_SETUP } from "../../../env";

export async function POST(req: NextRequest) {
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

  const recovery = await db.getRecoveryLockbox(session.userIdentifier);
  if (recovery != null) {
    return NextResponse.json(
      { error: "recovery lockbox already exists" },
      { status: 400 }
    );
  }

  const { registrationRequest } = await req.json();

  if (!registrationRequest)
    return NextResponse.json(
      { error: "missing registrationRequest" },
      { status: 400 }
    );

  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: SERVER_SETUP,
    userIdentifier: session.userIdentifier,
    registrationRequest,
  });

  return NextResponse.json({ registrationResponse });
}
