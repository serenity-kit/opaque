import { NextRequest, NextResponse } from "next/server";
import database from "../db";
import { cookies } from "next/dist/client/components/headers";
import { isValidLocker } from "@/app/utils/locker/server/isValidLocker";
import { LockerWithServerVerificationMac } from "@/app/utils/locker";

function isValidLockerPayload(
  data: unknown
): data is LockerWithServerVerificationMac {
  return (
    data != null &&
    typeof data === "object" &&
    "ciphertext" in data &&
    "nonce" in data &&
    "serverVerificationMac" in data &&
    typeof data.ciphertext === "string" &&
    typeof data.nonce === "string" &&
    typeof data.serverVerificationMac === "string"
  );
}

export async function POST(req: NextRequest) {
  const sessionCookie = cookies().get("session");

  if (!sessionCookie) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  const db = await database;
  const session = await db.getSession(sessionCookie.value);

  if (!session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  const payload: unknown = await req.json();

  if (!isValidLockerPayload(payload)) {
    return NextResponse.json(
      { error: "invalid locker payload" },
      { status: 400 }
    );
  }

  if (!isValidLocker({ locker: payload, sessionKey: session.sessionKey })) {
    return NextResponse.json({ error: "invalid locker" }, { status: 401 });
  }

  await db.setLocker(session.userIdentifier, {
    ciphertext: payload.ciphertext,
    nonce: payload.nonce,
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const sessionCookie = cookies().get("session");

  if (!sessionCookie) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  const db = await database;
  const session = await db.getSession(sessionCookie.value);

  if (!session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  const locker = await db.getLocker(session.userIdentifier);

  if (!locker) {
    return NextResponse.json({ error: "no locker data" }, { status: 404 });
  }

  return NextResponse.json(locker);
}
