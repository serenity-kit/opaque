import * as opaque from "@serenity-kit/opaque";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";

export async function POST(request: NextRequest) {
  const { userIdentifier, credentialFinalization } = await request.json();

  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );

  if (!credentialFinalization)
    return NextResponse.json(
      { error: "missing credentialFinalization" },
      { status: 400 }
    );

  const db = await database;
  const serverLogin = userIdentifier && db.getLogin(userIdentifier);

  if (!serverLogin)
    return NextResponse.json({ error: "login not started" }, { status: 400 });

  const sessionKey = opaque.serverLoginFinish({
    credentialFinalization,
    serverLogin,
  });

  await db.removeLogin(userIdentifier);
  return NextResponse.json({ success: true });
}
