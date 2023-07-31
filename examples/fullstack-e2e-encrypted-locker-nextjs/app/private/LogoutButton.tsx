"use client";

import { useRouter } from "next/navigation";
import { removeLoginKeys } from "../utils/auth";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-blue-500"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        removeLoginKeys();
        router.replace("/");
      }}
    >
      Logout
    </button>
  );
}
