"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { storeLoginKeys, usePrivateRedirect } from "../utils/auth";
import { login, register } from "../utils/client";

// we are importing the form dynamically with disabled ssr to prevent
// server-side rendering of the form so that our e2e tests will not
// submit the form before the JS event handlers are attached
const CredentialsForm = dynamic(() => import("../CredentialsForm"), {
  ssr: false,
});

export default function RegistrationForm() {
  const [showError, setShowError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const redirectPrivate = usePrivateRedirect();
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Register</h1>
      <CredentialsForm
        label="Register"
        invalid={showError}
        disabled={disabled}
        onChange={() => setShowError(false)}
        onSubmit={async ({ username, password }) => {
          setShowError(false);
          setDisabled(true);
          try {
            await register(username, password);
            console.log(`User "${username}" registered successfully`);
            const loginResult = await login(username, password);
            if (loginResult) {
              console.log(
                `User "${username}" logged in successfully; sessionKey = ${loginResult.sessionKey}`
              );
              storeLoginKeys(loginResult);
              redirectPrivate();
              return;
            } else {
              console.log(`User "${username}" login failed`);
              setShowError(true);
            }
          } catch (err) {
            setShowError(true);
            alert(err);
          }
          setDisabled(false);
        }}
      />
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/" className="text-blue-500 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
