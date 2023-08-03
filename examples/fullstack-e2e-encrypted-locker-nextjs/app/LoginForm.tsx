"use client";

import Link from "next/link";
import { useState } from "react";
import CredentialsForm from "./CredentialsForm";
import { storeLoginKeys, usePrivateRedirect } from "./utils/auth";
import { login } from "./utils/client";

export default function LoginForm() {
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const redirectPrivate = usePrivateRedirect();
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
              storeLoginKeys(loginResult);
              redirectPrivate();
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
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-blue-500">
          Register
        </Link>
      </p>
      <p>
        <Link className="text-sm underline text-gray-500" href="/recovery">
          Recover Locker
        </Link>
      </p>
    </div>
  );
}
