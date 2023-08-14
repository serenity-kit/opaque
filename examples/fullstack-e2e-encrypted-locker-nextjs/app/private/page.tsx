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

  const hasRecovery = null != (await db.getRecovery(session.userIdentifier));
  const hasLocker = null != (await db.getLocker(session.userIdentifier));

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
          <p className="text-gray-500 text-sm">Recovery Key is set</p>
          <RemoveRecoveryKeyButton />
        </div>
      )}

      {!hasRecovery && (
        <div className="flex space-x-2 items-center">
          {!hasLocker && (
            <div className="text-gray-500">
              Save a locker secret to create a recovery key.
            </div>
          )}
          {hasLocker && (
            <>
              <p className="text-gray-500 text-sm">No Recovery Key set</p>
              <CreateRecoveryKeyButton />
            </>
          )}
        </div>
      )}
    </div>
  );
}
