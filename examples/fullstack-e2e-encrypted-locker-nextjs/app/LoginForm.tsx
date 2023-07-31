"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import CredentialsForm from "./CredentialsForm";
import { login } from "./utils/auth";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Login</h1>
      <CredentialsForm
        invalid={showError}
        disabled={disabled}
        label="Login"
        onChange={() => setShowError(false)}
        onSubmit={async ({ username, password }) => {
          setShowError(false);
          setDisabled(true);
          try {
            const loginResult = await login(username, password);
            if (loginResult) {
              console.log(
                `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
              );
              router.replace("/private");
              // we are refreshing because there is a bug in the router which makes
              // it use a previously cached response even though the page should be dynamic
              // https://github.com/vercel/next.js/issues/49417#issuecomment-1546618485
              router.refresh();
              return;
            } else {
              setShowError(true);
            }
          } catch (err) {
            setShowError(true);
          }
          setDisabled(false);
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
