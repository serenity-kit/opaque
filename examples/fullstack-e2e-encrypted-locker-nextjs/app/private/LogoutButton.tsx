"use client";

import { useRouter } from "next/navigation";
import { removeLoginKeys } from "../utils/auth";
import { logout } from "../utils/client";

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
