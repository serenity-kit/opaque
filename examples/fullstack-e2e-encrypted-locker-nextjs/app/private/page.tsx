import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import database from "../api/db";
import CreateRecoveryKeyButton from "./CreateRecoveryKeyButton";
import Locker from "./Locker";
import LogoutButton from "./LogoutButton";
import RemoveRecoveryKeyButton from "./RemoveRecoveryKeyButton";

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

  const hasRecovery =
    null != (await db.getRecoveryLockbox(session.userIdentifier));

  return (
    <div className="p-12 flex flex-col items-start space-y-8 w-full">
      <p>
        You are logged in as user{" "}
        <span className="font-semibold bg-green-100 px-1 py-0.5 mr-4">
          {session.userIdentifier}
        </span>
        <LogoutButton />
      </p>

      <Locker />

      <hr className="w-full" />

      {hasRecovery && (
        <div className="flex space-x-2 items-center">
          <p className="text-gray-500 text-sm">Recovery Key was created</p>
          <RemoveRecoveryKeyButton />
        </div>
      )}

      {!hasRecovery && (
        <div className="flex space-x-2 items-center">
          <p className="text-gray-500 text-sm">No Recovery Key</p>
          <CreateRecoveryKeyButton />
        </div>
      )}
    </div>
  );
}
