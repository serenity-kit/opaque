"use client";

import { redirect } from "next/navigation";

export default function LogoutButton() {
  return (
    <button
      className="text-blue-500"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        redirect("/");
      }}
    >
      Logout
    </button>
  );
}
