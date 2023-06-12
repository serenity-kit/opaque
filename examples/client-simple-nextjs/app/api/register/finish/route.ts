import * as opaque from "@serenity-kit/opaque";
import { NextResponse } from "next/server";
import database from "../../db";

export async function POST(request: Request) {
  const { userIdentifier, registrationUpload } = await request.json();
  if (!userIdentifier)
    return NextResponse.json(
      { error: "missing userIdentifier" },
      { status: 400 }
    );
  if (!registrationUpload)
    return NextResponse.json(
      { error: "missing registrationUpload" },
      { status: 400 }
    );
  const db = await database;
  const passwordFile = opaque.serverRegistrationFinish(registrationUpload);
  db.setUser(userIdentifier, passwordFile);
  return NextResponse.json({ success: true });
}
