import { cookies } from "next/headers";
import database from "../api/db";
import React from "react";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";
import Locker from "./Locker";

export default async function PrivateHome() {
  const sessionCookie = cookies().get("session");
  if (!sessionCookie) {
    redirect("/");
  }
  const db = await database;
  const session = await db.getSession(sessionCookie.value);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="p-12 flex flex-col items-start space-y-8">
      <p>
        You are logged in as user{" "}
        <span className="font-semibold bg-green-100 px-1 py-0.5 mr-4">
          {session.userIdentifier}
        </span>
        <LogoutButton />
      </p>

      <Locker />
    </div>
  );
}
