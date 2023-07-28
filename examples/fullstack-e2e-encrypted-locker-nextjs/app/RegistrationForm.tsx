"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CredentialsForm from "./CredentialsForm";
import { login, register } from "./utils/auth";

export default function RegistrationForm() {
  const router = useRouter();
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Register</h1>
      <CredentialsForm
        label="Register"
        onSubmit={async ({ username, password }) => {
          try {
            await register(username, password);
            console.log(`User "${username}" registered successfully`);
            const loginResult = await login(username, password);
            if (loginResult) {
              console.log(
                `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
              );
              router.push("/private");
            } else {
              console.log(`User "${username}" login failed`);
            }
          } catch (err) {
            alert(err);
          }
        }}
      />
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/" className="text-blue-500">
          Login
        </Link>
      </p>
    </div>
  );
}
