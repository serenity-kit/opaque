import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";

export async function POST(request: NextRequest) {
  const { userIdentifier, credentialRequest } = await request.json();

  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );
  if (!credentialRequest)
    return NextResponse.json(
      { error: "missing credentialRequest" },
      { status: 400 }
    );

  const db = await database;
  const passwordFile = userIdentifier && db.getUser(userIdentifier);

  if (!passwordFile)
    return NextResponse.json({ error: "user not registered" }, { status: 400 });

  if (db.hasLogin(userIdentifier))
    return NextResponse.json(
      { error: "login already started" },
      { status: 400 }
    );

  const { serverLogin, credentialResponse } = opaque.serverLoginStart({
    serverSetup: db.getServerSetup(),
    userIdentifier,
    passwordFile,
    credentialRequest,
  });

  await db.setLogin(userIdentifier, serverLogin);
  return NextResponse.json({ credentialResponse });
}
