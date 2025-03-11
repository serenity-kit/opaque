import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Demoflow from "./Demoflow";
import LoginForm from "./LoginForm";
import database from "./api/db";

export default async function Home() {
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
    <div className="p-12 max-w-xl text-gray-900 flex flex-col space-y-16">
      <LoginForm />
      <hr />
      <Demoflow />
    </div>
  );
}
