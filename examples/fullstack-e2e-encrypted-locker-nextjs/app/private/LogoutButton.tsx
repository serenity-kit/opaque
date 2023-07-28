"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-blue-500"
      onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        router.replace("/");
      }}
    >
      Logout
    </button>
  );
}
