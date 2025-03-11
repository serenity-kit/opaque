import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import database from "../api/db";
import RegistrationForm from "./RegistrationForm";

export default async function RegistrationPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (sessionCookie) {
    const db = await database;
    const session = await db.getSession(sessionCookie.value);
    if (session) {
      redirect("/private");
    }
  }

  return (
    <div className="p-12 max-w-xl text-gray-900 space-y-4">
      <RegistrationForm />
    </div>
  );
}
