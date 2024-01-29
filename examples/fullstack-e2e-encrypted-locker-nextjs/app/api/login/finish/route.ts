import * as opaque from "@serenity-kit/opaque";
import { randomInt } from "crypto";
import { cookies } from "next/dist/client/components/headers";
import { NextRequest, NextResponse } from "next/server";
import database from "../../db";
import { checkRateLimit } from "../../rateLimiter";
import { LoginFinishParams } from "../../schema";

export async function POST(request: NextRequest) {
  if (checkRateLimit({ request })) {
    return NextResponse.json(
      { error: "You have exceeded 40 requests/min" },
      { status: 429 },
    );
  }

  let userIdentifier, finishLoginRequest;
  try {
    const rawValues = await request.json();
    const values = LoginFinishParams.parse(rawValues);
    userIdentifier = values.userIdentifier;
    finishLoginRequest = values.finishLoginRequest;
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid input values" },
      { status: 400 },
    );
  }

  const db = await database;
  const serverLoginState = await db.getLogin(userIdentifier);

  if (!serverLoginState)
    return NextResponse.json({ error: "login not started" }, { status: 400 });

  const { sessionKey } = opaque.server.finishLogin({
    finishLoginRequest,
    serverLoginState,
  });

  await db.removeLogin(userIdentifier);

  const sessionCookie = cookies().get("session");
  if (sessionCookie) {
    await db.removeSession(sessionCookie.value);
  }

  const sessionId = generateSessionId();
  await db.setSession(sessionId, { userIdentifier, sessionKey });

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Set-Cookie": `session=${sessionId}; HttpOnly; Path=/` },
  });
}

function generateSessionId() {
  return randomInt(1e9, 1e10).toString();
}
