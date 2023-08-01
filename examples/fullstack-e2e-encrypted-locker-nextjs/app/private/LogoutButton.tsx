"use client";

import { useRouter } from "next/navigation";
import { logout, removeLoginKeys } from "../utils/auth";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="text-blue-500"
      onClick={async () => {
        try {
          await logout();
        } finally {
          removeLoginKeys();
          router.replace("/");
        }
      }}
    >
      Logout
    </button>
  );
}
