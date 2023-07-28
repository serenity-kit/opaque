"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CredentialsForm from "./CredentialsForm";
import { login } from "./utils/auth";

export default function LoginForm() {
  const router = useRouter();
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Login</h1>
      <CredentialsForm
        label="Login"
        onSubmit={async ({ username, password }) => {
          const loginResult = await login(username, password);
          if (loginResult) {
            console.log(
              `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
            );
            router.replace("/private");
          } else {
            console.log(`User "${username}" login failed`);
          }
        }}
      />
      <p className="text-sm">
        Don't have an account?{" "}
        <Link href="/register" className="text-blue-500">
          Register
        </Link>
      </p>
    </div>
  );
}
