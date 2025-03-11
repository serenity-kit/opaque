import { LockerWithServerVerificationMac } from "@/app/utils/locker";
import { isValidLocker } from "@/app/utils/locker/server/isValidLocker";
import sodium from "libsodium-wrappers";
import { NextRequest, NextResponse } from "next/server";
import database from "../db";
import { checkRateLimit } from "../rateLimiter";
import withUserSession from "../withUserSession";

function isValidLockerPayload(
  data: unknown,
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

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  const db = await database;
  await sodium.ready;

  return withUserSession(db, async (session) => {
    const payload: unknown = await request.json();

    if (!isValidLockerPayload(payload)) {
      return NextResponse.json(
        { error: "invalid locker payload" },
        { status: 400 },
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
  });
}

export async function GET(req: NextRequest) {
  const db = await database;

  return withUserSession(db, async (session) => {
    const locker = await db.getLocker(session.userIdentifier);

    if (!locker) {
      return NextResponse.json({ error: "no locker data" }, { status: 404 });
    }

    return NextResponse.json(locker);
  });
}
