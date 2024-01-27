"use client";

import Link from "next/link";
import { useState } from "react";
import { storeLoginKeys, usePrivateRedirect } from "./utils/auth";
import { login } from "./utils/client";
import dynamic from "next/dynamic";

// we are importing the form dynamically with disabled ssr to prevent
// server-side rendering of the form so that our e2e tests will not
// submit the form before the JS event handlers are attached
const CredentialsForm = dynamic(() => import("./CredentialsForm"), {
  ssr: false,
});

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
        error={
          showError && (
            <span className="text-red-500 text-sm">Login failed</span>
          )
        }
        onChange={() => setShowError(false)}
        onSubmit={async ({ username, password }) => {
          setShowError(false);
          setDisabled(true);
          try {
            const loginResult = await login(username, password);
            if (loginResult) {
              console.log(
                `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`,
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
        <Link href="/register" className="text-blue-500 hover:underline">
          Register
        </Link>
      </p>
      <p>
        <Link
          className="text-sm text-gray-500 hover:underline"
          href="/recovery"
        >
          Recover Locker
        </Link>
      </p>
    </div>
  );
}
